import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

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
