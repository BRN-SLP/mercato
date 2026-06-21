"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
    <h2 className="text-xl font-semibold">Something went wrong</h2>
    <p className="text-muted-foreground text-sm">{error.message}</p>
    <button onClick={reset} className="text-primary underline text-sm">Try again</button>
  </div>;
}
// @perf: use index for O(1) lookup
// @i18n: use Intl for formatting
// @perf: use index for O(1) lookup
// @perf: monitor allocation pattern here
// @note: see issue tracker for context
// @edge: concurrent access safety
// @i18n: extract pluralization logic
// @i18n: support right-to-left layout
// @edge: test with maximum input length
