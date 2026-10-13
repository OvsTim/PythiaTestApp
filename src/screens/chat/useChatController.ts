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
import type {OutboundTurn} from './chatListTypes';
import {mergeMessages} from './mergeMessages';

const DEFAULT_POLL_RETRY_AFTER_SECONDS = null;

export function useChatController() {
  const dispatch = useDispatch<AppDispatch>();
  const {data, isLoading, isError, refetch, isFetching} = useListMessagesQuery();
  const [draftText, setDraftText] = useState('');
  const [outboundTurns, setOutboundTurns] = useState<OutboundTurn[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const busyRef = useRef(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    cancelledRef.current = false;
    return () => {
      cancelledRef.current = true;
    };
  }, []);

  const chronologicalRows = useMemo(
    () => buildChatList(data?.messages, outboundTurns),
    [data?.messages, outboundTurns],
  );

  /** Newest first for an inverted FlatList. */
  const listRows = useMemo(
    () => chronologicalRows.slice().reverse(),
    [chronologicalRows],
  );

  const hasMessages =
    (data?.messages?.length ?? 0) > 0 || outboundTurns.length > 0;
  const historySettled = !(isLoading && data == null);
  const canSend =
    draftText.trim().length > 0 && !isBusy && historySettled;

  const setBusy = useCallback((next: boolean) => {
    busyRef.current = next;
    setIsBusy(next);
  }, []);

  const patchListCache = useCallback(
    (incoming: Message[]) => {
      dispatch(
        messagesApi.util.updateQueryData('listMessages', undefined, draft => {
          draft.messages = mergeMessages(draft.messages, incoming);
        }),
      );
    },
    [dispatch],
  );

  const upsertOutbound = useCallback((turn: OutboundTurn) => {
    setOutboundTurns(current => {
      const without = current.filter(
        item => item.clientMessageId !== turn.clientMessageId,
      );
      return [...without, turn];
    });
  }, []);

  const removeOutbound = useCallback((clientMessageId: string) => {
    setOutboundTurns(current =>
      current.filter(item => item.clientMessageId !== clientMessageId),
    );
  }, []);

  const runSendFlow = useCallback(
    async (clientMessageId: string, text: string) => {
      if (busyRef.current) {
        return;
      }
      setBusy(true);
      upsertOutbound({clientMessageId, text, phase: 'sending'});

      let postAccepted = false;

      try {
        const sendResult = await sendMessageOnce(dispatch, {
          client_message_id: clientMessageId,
          text,
        });
        postAccepted = true;

        const {user_message, reply, retryAfterSeconds} = sendResult;
        patchListCache([user_message, reply]);

        if (reply.status === 'done') {
          removeOutbound(clientMessageId);
          return;
        }

        upsertOutbound({
          clientMessageId,
          replyId: reply.id,
          phase: 'thinking',
        });

        // Transient poll errors are retried inside pollUntilDone.
        // If that cycle still fails, try one more full poll — never Not sent.
        let doneReply: Message;
        try {
          doneReply = await pollUntilDone(
            dispatch,
            reply.id,
            retryAfterSeconds,
          );
        } catch {
          if (cancelledRef.current) {
            return;
          }
          doneReply = await pollUntilDone(
            dispatch,
            reply.id,
            DEFAULT_POLL_RETRY_AFTER_SECONDS,
          );
        }
        if (cancelledRef.current) {
          return;
        }
        patchListCache([doneReply]);
        removeOutbound(clientMessageId);
      } catch {
        if (!postAccepted && !cancelledRef.current) {
          upsertOutbound({clientMessageId, text, phase: 'failed'});
        }
        // After POST accept, a failed poll leaves phase: thinking (not Not sent).
      } finally {
        if (!cancelledRef.current) {
          setBusy(false);
        }
      }
    },
    [
      dispatch,
      patchListCache,
      removeOutbound,
      setBusy,
      upsertOutbound,
    ],
  );

  const send = useCallback(() => {
    const text = draftText.trim();
    if (text.length === 0 || busyRef.current || !historySettled) {
      return;
    }
    const clientMessageId = String(uuid.v4());
    setDraftText('');
    runSendFlow(clientMessageId, text).catch(() => {
      // Failures are handled inside runSendFlow (Not sent / poll retry).
    });
  }, [draftText, historySettled, runSendFlow]);

  const retry = useCallback(
    (clientMessageId: string) => {
      if (busyRef.current) {
        return;
      }
      const turn = outboundTurns.find(
        item => item.clientMessageId === clientMessageId,
      );
      if (turn == null || turn.phase !== 'failed') {
        return;
      }
      runSendFlow(clientMessageId, turn.text).catch(() => {
        // Failures are handled inside runSendFlow (Not sent / poll retry).
      });
    },
    [outboundTurns, runSendFlow],
  );

  return {
    listRows,
    isLoading: isLoading || (isFetching && !hasMessages),
    isError,
    refetch,
    draftText,
    setDraftText,
    canSend,
    isBusy,
    send,
    retry,
  };
}
