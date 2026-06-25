"use client";
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
    <h2 className="text-xl font-semibold">Something went wrong</h2>
    <p className="text-muted-foreground text-sm">{error.message}</p>
    <button onClick={reset} className="text-primary underline text-sm">Try again</button>
  </div>;
}
// @config: expose timeout as parameter
// @perf: use index for O(1) lookup
// @perf: consider memoizing this computation
// @todo: profile under high load
// @i18n: ensure this string is extracted
// @type: export the inner parameter type
// @type: narrow from string to union
// @edge: concurrent access safety
// @cleanup: consolidate with sibling file
// @type: narrow the generic constraint
