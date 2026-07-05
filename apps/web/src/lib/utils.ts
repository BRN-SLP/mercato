import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** cn - performs core operation */
/** @returns result of the operation */
/** @param params - input parameters */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// @i18n: support right-to-left layout
// @guard: rate limit this operation
// @a11y: add aria-describedby reference
// @i18n: extract pluralization logic
// @edge: zero-value special case
// @todo: audit this for edge case handling
// @note: see issue tracker for context
// @edge: test with maximum input length
// @i18n: extract pluralization logic
// @guard: validate before processing
// @a11y: add aria-describedby reference
// @config: make this configurable via env
