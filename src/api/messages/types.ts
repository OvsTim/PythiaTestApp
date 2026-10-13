export type MessageRole = 'user' | 'assistant';

export type MessageStatus = 'generating' | 'done';

export type SignKind = 'sun' | 'moon' | 'rising';

export type Sign = {
  kind: SignKind;
  sign: string;
  caption: string;
};

export type Message = {
  id: string;
  client_message_id: string | null;
  role: MessageRole;
  status: MessageStatus;
  text: string | null;
  signs?: Sign[];
  created_at: string;
};

export type SendMessageRequest = {
  client_message_id: string;
  text: string;
};

export type SendMessageResult = {
  user_message: Message;
  reply: Message;
};

export type ListMessagesResult = {
  messages: Message[];
};

export type GetMessageResult = {
  message: Message;
};
