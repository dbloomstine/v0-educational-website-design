/**
 * Fund Watch Automation System - Retry Utility
 *
 * Exponential backoff retry logic for API calls.
 */

export interface RetryOptions {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 3,
  initialDelayMs: 1000,
  maxDelayMs: 30000,
  backoffMultiplier: 2,
  retryableErrors: [
    'rate_limit',
    'overloaded',
    '529',
    '529',
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'socket hang up',
    '503',
    '502',
    '500',
  ],
};

/**
 * Sleep for a given number of milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: unknown, retryableErrors: string[]): boolean {
  const errorString = String(error).toLowerCase();
  return retryableErrors.some((e) => errorString.includes(e.toLowerCase()));
}

/**
 * Execute a function with exponential backoff retry
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: unknown;
  let delay = opts.initialDelayMs;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt >= opts.maxRetries) {
        break;
      }

      if (!isRetryableError(error, opts.retryableErrors)) {
        // Non-retryable error, throw immediately
        throw error;
      }

      // Log retry attempt
      console.warn(
        `[Retry] Attempt ${attempt + 1}/${opts.maxRetries + 1} failed, ` +
          `retrying in ${delay}ms: ${String(error).slice(0, 100)}`
      );

      // Wait before retrying
      await sleep(delay);

      // Increase delay for next attempt (exponential backoff)
      delay = Math.min(delay * opts.backoffMultiplier, opts.maxDelayMs);
    }
  }

  // All retries exhausted
  throw lastError;
}

/**
 * Execute a function with retry, returning null on failure instead of throwing
 */
export async function withRetryOrNull<T>(
  fn: () => Promise<T>,
  options: Partial<RetryOptions> = {}
): Promise<T | null> {
  try {
    return await withRetry(fn, options);
  } catch (error) {
    console.error(`[Retry] All retries exhausted: ${String(error).slice(0, 100)}`);
    return null;
  }
}
