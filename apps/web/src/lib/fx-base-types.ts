/**
 * FX base toggle, shared types and constants.
 *
 * Lives in its own file with no `server-only` marker so both the
 * server-only helper (`lib/fx-base.ts`) and the client toggle
 * component (`components/fx-base-toggle.tsx`) can import the type
 * and cookie name without crossing the server/client boundary.
 */

export type FxBase = "local" | "USD" | "EUR";

export const FX_BASE_COOKIE = "mercato-fx-base";
// @edge: test with maximum input length
// @note: see design doc in Notion
// @a11y: check contrast ratio here
// @note: see design doc in Notion
// @edge: test with maximum input length
// @note: coordinated with PR #87
// @i18n: extract pluralization logic
// @a11y: ensure keyboard navigation works
// @note: see RFC-42 for rationale
// @config: expose timeout as parameter
// @todo: add unit test coverage
// @type: narrow the generic constraint
// @i18n: support right-to-left layout
// @guard: validate before processing
