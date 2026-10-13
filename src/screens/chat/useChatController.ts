import {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import uuid from 'react-native-uuid';
import {useDispatch} from 'react-redux';

import {
  messagesApi,
  pollUntilDone,
  sendMessageOnce,
  useListMessagesQuery,
  type AppDispatch,
  type Message,
} from '../../api';

import {buildChatList} from './buildChatList';
import type {OutboundMessage} from './chatListTypes';
import {mergeMessages} from './mergeMessages';

type PollSession = {
  signal: AbortSignal;
  replyIds: Set<string>;
};

export function useChatController() {
  const dispatch = useDispatch<AppDispatch>();
  const {data, isFetching, isError, refetch} = useListMessagesQuery();
  const serverMessages = data?.messages;
  const [draftText, setDraftText] = useState('');
  const [outboundMessages, setOutboundMessages] = useState<OutboundMessage[]>(
    [],
  );
  /** Two taps in one frame both see stale React state, so guard synchronously. */
  const isPostInFlightRef = useRef(false);
  const pollSessionRef = useRef<PollSession | null>(null);

  /** Per mount, so a remount (or Fast Refresh) restarts polling cleanly. */
  useEffect(() => {
    const controller = new AbortController();
    pollSessionRef.current = {signal: controller.signal, replyIds: new Set()};
    return () => controller.abort();
  }, []);

  const listRows = useMemo(
    () => buildChatList(serverMessages, outboundMessages),
    [serverMessages, outboundMessages],
  );

  const hasGeneratingReply =
    serverMessages?.some(message => message.status === 'generating') ?? false;
  const isBusy =
    hasGeneratingReply ||
    outboundMessages.some(message => message.delivery === 'sending');
  const canSend =
    draftText.trim().length > 0 && serverMessages != null && !isBusy;

  const patchHistory = useCallback(
    (incoming: Message[]) => {
      dispatch(
        messagesApi.util.updateQueryData('listMessages', undefined, draft => {
          draft.messages = mergeMessages(draft.messages, incoming);
        }),
      );
    },
    [dispatch],
  );

  const setOutbound = useCallback((message: OutboundMessage) => {
    setOutboundMessages(current =>
      current.some(item => item.clientMessageId === message.clientMessageId)
        ? current.map(item =>
            item.clientMessageId === message.clientMessageId ? message : item,
          )
        : [...current, message],
    );
  }, []);

  const removeOutbound = useCallback((clientMessageId: string) => {
    setOutboundMessages(current =>
      current.filter(item => item.clientMessageId !== clientMessageId),
    );
  }, []);

  /** At most one poll per reply, whether it came from a send or from history. */
  const pollReply = useCallback(
    async (replyId: string, retryAfterSeconds: number | null) => {
      const session = pollSessionRef.current;
      if (session == null || session.replyIds.has(replyId)) {
        return;
      }
      session.replyIds.add(replyId);
      const reply = await pollUntilDone(
        dispatch,
        replyId,
        retryAfterSeconds,
        session.signal,
      );
      session.replyIds.delete(replyId);
      if (reply != null) {
        patchHistory([reply]);
      }
    },
    [dispatch, patchHistory],
  );

  /** Replies still generating when history loads (e.g. after an app reload). */
  useEffect(() => {
    for (const message of serverMessages ?? []) {
      if (message.status === 'generating') {
        pollReply(message.id, null);
      }
    }
  }, [pollReply, serverMessages]);

  const postMessage = useCallback(
    async (clientMessageId: string, text: string) => {
      if (isPostInFlightRef.current) {
        return;
      }
      isPostInFlightRef.current = true;
      setOutbound({clientMessageId, text, delivery: 'sending'});

      try {
        const {user_message, reply, retryAfterSeconds} = await sendMessageOnce(
          dispatch,
          {client_message_id: clientMessageId, text},
        );
        if (reply.status === 'generating') {
          // Must register before the reply reaches the cache, or the history
          // effect starts its own poll without this Retry-After.
          pollReply(reply.id, retryAfterSeconds);
        }
        patchHistory([user_message, reply]);
        removeOutbound(clientMessageId);
      } catch {
        setOutbound({clientMessageId, text, delivery: 'failed'});
      } finally {
        isPostInFlightRef.current = false;
      }
    },
    [dispatch, patchHistory, pollReply, removeOutbound, setOutbound],
  );

  const send = useCallback(() => {
    if (!canSend) {
      return;
    }
    setDraftText('');
    postMessage(String(uuid.v4()), draftText.trim());
  }, [canSend, draftText, postMessage]);

  return {
    listRows,
    isHistoryLoading: isFetching && serverMessages == null,
    isHistoryError: isError,
    reloadHistory: refetch,
    draftText,
    setDraftText,
    canSend,
    isBusy,
    send,
    retry: postMessage,
  };
}
