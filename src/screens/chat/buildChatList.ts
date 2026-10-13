import type {Message} from '../../api';

import type {ChatListRow, OutboundMessage} from './chatListTypes';

function toServerRow(message: Message): ChatListRow {
  if ((message.signs?.length ?? 0) > 0) {
    return {kind: 'intro', key: message.id, message};
  }
  if (message.role === 'user') {
    return {
      kind: 'user',
      key: message.id,
      text: message.text ?? '',
      delivery: 'sent',
    };
  }
  if (message.status === 'generating') {
    return {kind: 'thinking', key: message.id};
  }
  return {kind: 'assistant', key: message.id, text: message.text ?? ''};
}

function toOutboundRow(message: OutboundMessage): ChatListRow {
  const key = `local:${message.clientMessageId}`;
  if (message.delivery === 'failed') {
    return {
      kind: 'user',
      key,
      text: message.text,
      delivery: 'failed',
      clientMessageId: message.clientMessageId,
    };
  }
  return {kind: 'user', key, text: message.text, delivery: 'sending'};
}

/**
 * Rows newest first, for the inverted FlatList. A server user message is
 * hidden while a local copy with the same client_message_id is pending, so a
 * POST that failed after the server saved it never shows up twice.
 */
export function buildChatList(
  serverMessages: Message[] | undefined,
  outboundMessages: OutboundMessage[],
): ChatListRow[] {
  const pendingClientIds = new Set(
    outboundMessages.map(message => message.clientMessageId),
  );
  const rows: ChatListRow[] = [];

  for (const message of serverMessages ?? []) {
    const clientId = message.client_message_id;
    if (clientId != null && pendingClientIds.has(clientId)) {
      continue;
    }
    rows.push(toServerRow(message));
  }
  for (const message of outboundMessages) {
    rows.push(toOutboundRow(message));
  }

  return rows.reverse();
}
