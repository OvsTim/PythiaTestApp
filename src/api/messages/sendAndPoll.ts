import type {AppDispatch} from '../store';
import {
  isApiRequestError,
  type ApiRequestError,
  type WithRetryAfter,
} from '../types';
import {resolveWaitSeconds, waitSeconds} from '../retryAfter';
import {messagesApi} from './messagesApi';
import type {Message, SendMessageRequest, SendMessageResult} from './types';

const MAX_POLL_ATTEMPTS = 60;

export type SendAndPollResult = {
  user_message: Message;
  reply: Message;
};

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

/**
 * One POST /messages. Transient 500 / network failures are not retried here —
 * the UI shows Not sent and the user taps Retry with the same client_message_id.
 */
export async function sendMessageOnce(
  dispatch: AppDispatch,
  request: SendMessageRequest,
): Promise<WithRetryAfter<SendMessageResult>> {
  const result = await dispatch(
    messagesApi.endpoints.sendMessage.initiate(request),
  );

  if (result.data) {
    return result.data;
  }

  throw requireApiError(result.error, 'sendMessage');
}

/**
 * Polls GET /messages/{id} until status is done, respecting Retry-After / 429.
 * Poll failures are retried automatically (not a send failure per the brief).
 * Each initiate() subscription is unsubscribed so the poll does not leak.
 */
export async function pollUntilDone(
  dispatch: AppDispatch,
  replyId: string,
  initialRetryAfterSeconds: number | null,
): Promise<Message> {
  let wait = resolveWaitSeconds(initialRetryAfterSeconds);

  for (let attempt = 1; attempt <= MAX_POLL_ATTEMPTS; attempt += 1) {
    await waitSeconds(wait);

    const result = dispatch(
      messagesApi.endpoints.getMessage.initiate(replyId, {
        forceRefetch: true,
      }),
    );

    try {
      const resolved = await result;

      if (resolved.data) {
        const {message, retryAfterSeconds} = resolved.data;
        if (message.status === 'done') {
          return message;
        }
        wait = resolveWaitSeconds(retryAfterSeconds);
        continue;
      }

      const error = requireApiError(resolved.error, 'getMessage');
      if (!isRetryablePollError(error)) {
        throw error;
      }

      wait = resolveWaitSeconds(error.retryAfterSeconds);
    } finally {
      result.unsubscribe();
    }
  }

  throw new Error(`getMessage polling timed out for reply ${replyId}`);
}

/**
 * Sends once, then polls the assistant reply until done.
 * Prefer calling `sendMessageOnce` + `pollUntilDone` from the chat controller
 * when UI must show thinking only after the POST is accepted.
 */
export async function sendAndPoll(
  dispatch: AppDispatch,
  request: SendMessageRequest,
): Promise<SendAndPollResult> {
  const sendResult = await sendMessageOnce(dispatch, request);
  const {user_message, reply, retryAfterSeconds} = sendResult;

  if (reply.status === 'done') {
    return {user_message, reply};
  }

  const doneReply = await pollUntilDone(dispatch, reply.id, retryAfterSeconds);
  return {user_message, reply: doneReply};
}
