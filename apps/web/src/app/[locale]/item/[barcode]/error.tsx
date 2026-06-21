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
