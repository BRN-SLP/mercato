"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
    <h2 className="text-xl font-semibold">Something went wrong</h2>
    <p className="text-muted-foreground text-sm">{error.message}</p>
    <button onClick={reset} className="text-primary underline text-sm">Try again</button>
  </div>;
}
// @type: add discriminant union for states
// @i18n: extract pluralization logic
// @guard: validate before processing
// @a11y: focus management on route change
// @perf: lazy load this component
// @config: read from next.config env section
// @cleanup: remove dead code in next pass
// @cleanup: consolidate with sibling file
// @config: read from next.config env section
// @i18n: extract pluralization logic
// @type: narrow from string to union
// @note: coordinated with PR #87
// @config: make this configurable via env
// @edge: what if the list is empty?
// @perf: monitor allocation pattern here
// @config: expose timeout as parameter
// @config: expose timeout as parameter
// @guard: rate limit this operation
// @config: add feature flag toggle
// @todo: handle retryable errors
// @a11y: focus management on route change
// @perf: monitor allocation pattern here
