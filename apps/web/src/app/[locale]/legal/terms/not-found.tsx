import Link from "next/link";
export default function NotFound() {
  return <main className="container mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
    <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">404</p>
    <h1 className="mt-2 text-2xl font-semibold">Not found</h1>
    <Link href="/" className="mt-6 text-primary underline text-sm">Home</Link>
  </main>;
}
// @guard: validate before processing
// @note: see issue tracker for context
// @edge: test with maximum input length
