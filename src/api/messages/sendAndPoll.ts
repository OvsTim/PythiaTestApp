import type {AppDispatch} from '../store';
import {
  isApiRequestError,
  type ApiRequestError,
  type WithRetryAfter,
} from '../types';
import {resolveWaitSeconds, waitSeconds} from '../retryAfter';
import {messagesApi} from './messagesApi';
import type {Message, SendMessageRequest, SendMessageResult} from './types';

const MAX_SEND_ATTEMPTS = 8;
const MAX_POLL_ATTEMPTS = 60;

export type SendAndPollResult = {
  user_message: Message;
  reply: Message;
};

function isRetryableSendError(error: ApiRequestError): boolean {
  return (
    error.status === 500 ||
    error.status === 'FETCH_ERROR' ||
    error.status === 'TIMEOUT_ERROR'
  );
}

function isRetryablePollError(error: ApiRequestError): boolean {
  return (
    error.status === 429 ||
    error.status === 500 ||
    error.status === 'FETCH_ERROR' ||
    error.status === 'TIMEOUT_ERROR'
  );
}

function requireApiError(error: unknown, context: string): ApiRequestError {
  if (isApiRequestError(error)) {
    return error;
  }
  throw error ?? new Error(`${context} failed without an API error`);
}

async function sendWithRetry(
  dispatch: AppDispatch,
  request: SendMessageRequest,
): Promise<WithRetryAfter<SendMessageResult>> {
  let lastError: ApiRequestError | undefined;

  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt += 1) {
    const result = await dispatch(
      messagesApi.endpoints.sendMessage.initiate(request),
    );

    if (result.data) {
      return result.data;
    }

    const error = requireApiError(result.error, 'sendMessage');
    if (!isRetryableSendError(error)) {
      throw error;
    }

    lastError = error;
    if (attempt < MAX_SEND_ATTEMPTS) {
      await waitSeconds(resolveWaitSeconds(error.retryAfterSeconds));
    }
  }

  throw lastError ?? new Error('sendMessage exhausted retries');
}

async function pollUntilDone(
  dispatch: AppDispatch,
  replyId: string,
  initialRetryAfterSeconds: number | null,
): Promise<Message> {
  let wait = resolveWaitSeconds(initialRetryAfterSeconds);

  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
    await waitSeconds(wait);

    const result = await dispatch(
      messagesApi.endpoints.getMessage.initiate(replyId, {
        forceRefetch: true,
      }),
    );

    if (result.data) {
      const {message, retryAfterSeconds} = result.data;
      if (message.status === 'done') {
        return message;
      }
      wait = resolveWaitSeconds(retryAfterSeconds);
      continue;
    }

    const error = requireApiError(result.error, 'getMessage');
    if (!isRetryablePollError(error)) {
      throw error;
    }

    wait = resolveWaitSeconds(error.retryAfterSeconds);
  }

  throw new Error(`getMessage polling timed out for reply ${replyId}`);
}

/**
 * Sends a user message (retrying transient failures with the same
 * `client_message_id`), then polls the assistant reply until `status === 'done'`,
 * respecting `Retry-After` / 429.
 */
export async function sendAndPoll(
  dispatch: AppDispatch,
  request: SendMessageRequest,
): Promise<SendAndPollResult> {
  const sendResult = await sendWithRetry(dispatch, request);
  const {user_message, reply, retryAfterSeconds} = sendResult;

  if (reply.status === 'done') {
    return {user_message, reply};
  }

  const doneReply = await pollUntilDone(dispatch, reply.id, retryAfterSeconds);
  return {user_message, reply: doneReply};
}
