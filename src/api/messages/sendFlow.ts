import type {AppDispatch} from '../store';
import {resolveWaitSeconds, waitSeconds} from '../retryAfter';
import {isApiRequestError, type WithRetryAfter} from '../types';
import {messagesApi} from './messagesApi';
import type {Message, SendMessageRequest, SendMessageResult} from './types';

/**
 * One POST /messages. Rejects on 500 / network / timeout with no automatic
 * retry: the UI shows Not sent and Retry re-sends the same client_message_id.
 */
export function sendMessageOnce(
  dispatch: AppDispatch,
  request: SendMessageRequest,
): Promise<WithRetryAfter<SendMessageResult>> {
  return dispatch(
    messagesApi.endpoints.sendMessage.initiate(request, {track: false}),
  ).unwrap();
}

/**
 * Polls GET /messages/{id} until the reply is done, never earlier than the
 * previous Retry-After. Any poll error (429, 500, network) waits and polls
 * again: it is not a send failure. Resolves null if `signal` aborts first.
 */
export async function pollUntilDone(
  dispatch: AppDispatch,
  replyId: string,
  initialRetryAfterSeconds: number | null,
  signal: AbortSignal,
): Promise<Message | null> {
  let retryAfterSeconds = initialRetryAfterSeconds;

  for (;;) {
    await waitSeconds(resolveWaitSeconds(retryAfterSeconds), signal);
    if (signal.aborted) {
      return null;
    }

    const request = dispatch(
      messagesApi.endpoints.getMessage.initiate(replyId, {forceRefetch: true}),
    );
    const result = await request;
    request.unsubscribe();

    if (result.isSuccess) {
      if (result.data.message.status === 'done') {
        return result.data.message;
      }
      retryAfterSeconds = result.data.retryAfterSeconds;
    } else {
      retryAfterSeconds = isApiRequestError(result.error)
        ? result.error.retryAfterSeconds
        : null;
    }
  }
}
