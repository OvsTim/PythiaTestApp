import {
  fetchBaseQuery,
  type BaseQueryFn,
  type FetchArgs,
  type FetchBaseQueryError,
} from '@reduxjs/toolkit/query';

import {API_BASE_URL} from './baseUrl';
import {parseRetryAfterSeconds} from './retryAfter';
import {isApiErrorBody, type ApiRequestError} from './types';

export type ApiBaseQueryMeta = {
  retryAfterSeconds: number | null;
};

/**
 * RTK отдаёт FetchBaseQueryError как union — приводим к одному ApiRequestError,
 * чтобы sendAndPoll смотрел только status + retryAfterSeconds.
 *
 * - status: number → сервер ответил (400/429/500…); тело берём только если
 *   это формат мока `{ error: { code, message } }`.
 * - иначе → сеть/таймаут/парсинг (`FETCH_ERROR` и т.п.); текст в `message`.
 * Retry-After прокидываем в обе ветки (нужен для 429 и иногда для 5xx).
 */
function toApiRequestError(
  error: FetchBaseQueryError,
  retryAfterSeconds: number | null,
): ApiRequestError {
  if (typeof error.status === 'number') {
    return {
      status: error.status,
      data: isApiErrorBody(error.data) ? error.data : undefined,
      retryAfterSeconds,
    };
  }

  return {
    status: error.status,
    message: error.error,
    retryAfterSeconds,
  };
}

const rawBaseQuery = fetchBaseQuery({
  baseUrl: API_BASE_URL,
});

/**
 * Обёртка над fetchBaseQuery: обычный fetch не отдаёт Retry-After в data.
 * После каждого ответа читаем заголовок и кладём секунды в meta
 * (успех → transformResponse вшивает их в data; ошибка → в ApiRequestError).
 */
export const apiBaseQuery: BaseQueryFn<
  string | FetchArgs,
  unknown,
  ApiRequestError,
  object,
  ApiBaseQueryMeta
> = async (args, api, extraOptions) => {
  const result = await rawBaseQuery(args, api, extraOptions);
  const retryAfterSeconds = parseRetryAfterSeconds(
    result.meta?.response?.headers.get('Retry-After'),
  );

  if (result.error) {
    return {
      error: toApiRequestError(result.error, retryAfterSeconds),
      meta: {retryAfterSeconds},
    };
  }

  return {
    data: result.data,
    meta: {retryAfterSeconds},
  };
};
