import type {Message} from '../../api';

/**
 * A user message the server has not accepted yet. Once POST succeeds it moves
 * into the history cache and the local copy is dropped.
 */
export type OutboundMessage = {
  clientMessageId: string;
  text: string;
  delivery: 'sending' | 'failed';
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
      text: string;
      delivery: 'sending' | 'sent';
    }
  | {
      kind: 'user';
      key: string;
      text: string;
      delivery: 'failed';
      clientMessageId: string;
    }
  | {
      kind: 'assistant';
      key: string;
      text: string;
    }
  | {
      kind: 'thinking';
      key: string;
    };
