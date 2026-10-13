import type {WithRetryAfter} from './types';

const DEFAULT_RETRY_AFTER_SECONDS = 2;

/**
 * Parses a Retry-After header value (seconds) into a non-negative integer.
 * Returns null when missing or not a valid number.
 */
export function parseRetryAfterSeconds(
  headerValue: string | null | undefined,
): number | null {
  if (headerValue == null || headerValue === '') {
    return null;
  }
  const seconds = Number.parseInt(headerValue, 10);
  if (!Number.isFinite(seconds) || seconds < 0) {
    return null;
  }
  return seconds;
}

export function waitSeconds(seconds: number): Promise<void> {
  const ms = Math.max(0, seconds) * 1000;
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

/** Seconds to wait: header value, or a small default when the server omitted it. */
export function resolveWaitSeconds(retryAfterSeconds: number | null): number {
  return retryAfterSeconds ?? DEFAULT_RETRY_AFTER_SECONDS;
}

export function withRetryAfter<T>(
  data: T,
  retryAfterSeconds: number | null | undefined,
): WithRetryAfter<T> {
  return {
    ...data,
    retryAfterSeconds: retryAfterSeconds ?? null,
  };
}
