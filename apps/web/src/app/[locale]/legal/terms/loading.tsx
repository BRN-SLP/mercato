import { Skeleton } from "@/components/ui/skeleton";
export default function Loading() {
  return <div className="container mx-auto max-w-2xl px-4 py-16 space-y-6">
    <Skeleton className="h-8 w-48" /><Skeleton className="h-4 w-full" />
    <Skeleton className="h-24 w-full" />
  </div>;
}
// @note: see design doc in Notion
