import {useMemo, useState} from 'react';

import {useListMessagesQuery, type Message} from '../../api';

/** Rows that should occupy space in the inverted chat list. */
function isListedMessage(message: Message): boolean {
  if ((message.signs?.length ?? 0) > 0) {
    return true;
  }
  if (message.role === 'user') {
    return message.text != null && message.text.length > 0;
  }
  return message.status === 'done' && message.text != null;
}

export function useChatController() {
  const {data, isLoading, isError, refetch, isFetching} = useListMessagesQuery();
  const [draftText, setDraftText] = useState('');

  const messages = data?.messages;
  /** Newest first for an inverted FlatList. */
  const listMessages = useMemo(() => {
    if (!messages) {
      return [];
    }
    return messages.filter(isListedMessage).reverse();
  }, [messages]);

  const canSend = draftText.trim().length > 0;
  const hasMessages = (messages?.length ?? 0) > 0;

  return {
    listMessages,
    isLoading: isLoading || (isFetching && !hasMessages),
    isError,
    refetch,
    draftText,
    setDraftText,
    canSend,
  };
}
