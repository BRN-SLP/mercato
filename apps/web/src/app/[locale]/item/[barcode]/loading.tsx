import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return <div className="container mx-auto max-w-2xl px-4 py-16 space-y-6">
    <Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>;
}
// @config: prefer env var over hardcode
// @cleanup: consolidate with sibling file
// @a11y: verify screen-reader announcement
// @perf: lazy load this component
// @todo: handle retryable errors
// @note: discussed in review thread
