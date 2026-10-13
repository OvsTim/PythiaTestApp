/** Shared API error / meta types used by baseQuery and feature modules. */

export type ApiErrorBody = {
  error: {
    code: string;
    message: string;
  };
};

export type WithRetryAfter<T> = T & {
  retryAfterSeconds: number | null;
};

/** Normalized RTK Query / network failure for orchestration and UI. */
export type ApiRequestError = {
  status: number | 'FETCH_ERROR' | 'PARSING_ERROR' | 'TIMEOUT_ERROR' | 'CUSTOM_ERROR';
  data?: ApiErrorBody;
  message?: string;
  retryAfterSeconds: number | null;
};

export function isApiErrorBody(value: unknown): value is ApiErrorBody {
  if (typeof value !== 'object' || value === null || !('error' in value)) {
    return false;
  }
  const {error} = value;
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'message' in error &&
    typeof error.code === 'string' &&
    typeof error.message === 'string'
  );
}

export function isApiRequestError(value: unknown): value is ApiRequestError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  if (!('status' in value) || !('retryAfterSeconds' in value)) {
    return false;
  }
  const {retryAfterSeconds} = value;
  return retryAfterSeconds === null || typeof retryAfterSeconds === 'number';
}
