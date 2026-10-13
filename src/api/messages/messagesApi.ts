import {createApi} from '@reduxjs/toolkit/query/react';

import {apiBaseQuery, type ApiBaseQueryMeta} from '../baseQuery';
import {withRetryAfter} from '../retryAfter';
import type {WithRetryAfter} from '../types';
import type {
  GetMessageResult,
  ListMessagesResult,
  SendMessageRequest,
  SendMessageResult,
} from './types';

export const messagesApi = createApi({
  reducerPath: 'messagesApi',
  baseQuery: apiBaseQuery,
  endpoints: builder => ({
    listMessages: builder.query<ListMessagesResult, void>({
      query: () => '/messages',
    }),
    sendMessage: builder.mutation<
      WithRetryAfter<SendMessageResult>,
      SendMessageRequest
    >({
      query: body => ({
        url: '/messages',
        method: 'POST',
        body,
      }),
      transformResponse: (
        response: SendMessageResult,
        meta: ApiBaseQueryMeta | undefined,
      ) => withRetryAfter(response, meta?.retryAfterSeconds),
    }),
    getMessage: builder.query<WithRetryAfter<GetMessageResult>, string>({
      query: id => `/messages/${id}`,
      transformResponse: (
        response: GetMessageResult,
        meta: ApiBaseQueryMeta | undefined,
      ) => withRetryAfter(response, meta?.retryAfterSeconds),
    }),
  }),
});

export const {
  useListMessagesQuery,
  useSendMessageMutation,
  useGetMessageQuery,
  useLazyGetMessageQuery,
} = messagesApi;
