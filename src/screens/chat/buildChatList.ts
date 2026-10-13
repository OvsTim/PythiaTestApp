import type {Message} from '../../api';

import type {ChatListRow, OutboundTurn} from './chatListTypes';

function isIntro(message: Message): boolean {
  return (message.signs?.length ?? 0) > 0;
}

function clientIdsInPhase(
  turns: OutboundTurn[],
  phase: OutboundTurn['phase'],
): Set<string> {
  const ids = new Set<string>();
  for (const turn of turns) {
    if (turn.phase === phase) {
      ids.add(turn.clientMessageId);
    }
  }
  return ids;
}

/**
 * Builds FlatList rows (oldest → newest). Caller reverses for inverted list.
 * Dedupes by client_message_id so a 500-after-save never shows both a local
 * Not sent bubble and the same server user message.
 */
export function buildChatList(
  serverMessages: Message[] | undefined,
  outboundTurns: OutboundTurn[],
): ChatListRow[] {
  const localBubbleByClientId = new Map(
    outboundTurns
      .filter(
        (turn): turn is Extract<OutboundTurn, {phase: 'sending' | 'failed'}> =>
          turn.phase === 'sending' || turn.phase === 'failed',
      )
      .map(turn => [turn.clientMessageId, turn]),
  );
  const thinkingClientIds = clientIdsInPhase(outboundTurns, 'thinking');
  const suppressedClientIds = new Set(localBubbleByClientId.keys());

  const generatingReplyToUserClientId = new Map<string, string>();
  if (serverMessages) {
    for (let index = 0; index < serverMessages.length; index += 1) {
      const message = serverMessages[index];
      if (
        message.role === 'assistant' &&
        message.status === 'generating' &&
        index > 0
      ) {
        const previous = serverMessages[index - 1];
        if (previous.role === 'user' && previous.client_message_id != null) {
          generatingReplyToUserClientId.set(
            message.id,
            previous.client_message_id,
          );
        }
      }
    }
  }

  const rows: ChatListRow[] = [];

  if (serverMessages) {
    for (const message of serverMessages) {
      if (isIntro(message)) {
        rows.push({
          kind: 'intro',
          key: message.id,
          message,
        });
        continue;
      }

      if (message.role === 'user') {
        const clientId = message.client_message_id;
        if (clientId != null && suppressedClientIds.has(clientId)) {
          continue;
        }
        if (message.text == null || message.text.length === 0) {
          continue;
        }
        rows.push({
          kind: 'user',
          key: message.id,
          clientMessageId: clientId ?? message.id,
          text: message.text,
          delivery: 'sent',
        });
        continue;
      }

      if (message.status === 'generating') {
        const clientId =
          generatingReplyToUserClientId.get(message.id) ?? message.id;
        // Local failed/sending suppress the server copy; thinking row is owned
        // by the outbound turn (or synthesized below if only on server).
        if (
          suppressedClientIds.has(clientId) ||
          thinkingClientIds.has(clientId)
        ) {
          continue;
        }
        rows.push({
          kind: 'thinking',
          key: `thinking:${clientId}`,
          clientMessageId: clientId,
        });
        continue;
      }

      if (message.text == null || message.text.length === 0) {
        continue;
      }
      rows.push({
        kind: 'assistant',
        key: message.id,
        id: message.id,
        text: message.text,
      });
    }
  }

  for (const turn of outboundTurns) {
    if (turn.phase === 'sending' || turn.phase === 'failed') {
      rows.push({
        kind: 'user',
        key: `local:${turn.clientMessageId}`,
        clientMessageId: turn.clientMessageId,
        text: turn.text,
        delivery: turn.phase,
      });
      continue;
    }

    // thinking — user already rendered from server cache
    if (
      !rows.some(
        row =>
          row.kind === 'thinking' &&
          row.clientMessageId === turn.clientMessageId,
      )
    ) {
      rows.push({
        kind: 'thinking',
        key: `thinking:${turn.clientMessageId}`,
        clientMessageId: turn.clientMessageId,
      });
    }
  }

  return rows;
}
