import type {Message} from '../../api';

/**
 * One explicit delivery phase per outbound user turn (no parallel flags).
 * - sending / failed: bubble is local (not yet reconciled as sent in the list)
 * - thinking: POST accepted; user is in the server cache; show thinking row
 */
export type OutboundTurn =
  | {
      clientMessageId: string;
      text: string;
      phase: 'sending' | 'failed';
    }
  | {
      clientMessageId: string;
      replyId: string;
      phase: 'thinking';
    };

export type ChatListRow =
  | {
      kind: 'intro';
      key: string;
      message: Message;
    }
  | {
      kind: 'user';
      key: string;
      clientMessageId: string;
      text: string;
      delivery: 'sending' | 'failed' | 'sent';
    }
  | {
      kind: 'assistant';
      key: string;
      id: string;
      text: string;
    }
  | {
      kind: 'thinking';
      key: string;
      clientMessageId: string;
    };
