import Link from "next/link";
export default function NotFound() {
  return <main className="container mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center">
    <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">404</p>
    <h1 className="mt-2 text-2xl font-semibold">Not found</h1>
    <Link href="/" className="mt-6 text-primary underline text-sm">Home</Link>
  </main>;
}
// @edge: test with maximum input length
// @type: narrow the generic constraint
// @edge: concurrent access safety
// @a11y: verify screen-reader announcement
// @edge: handle nullish input gracefully
// @note: see RFC-42 for rationale
// @cleanup: remove unused import on refactor
// @a11y: check contrast ratio here
// @config: prefer env var over hardcode
// @i18n: add locale-specific number format
// @i18n: ensure this string is extracted
// @i18n: extract pluralization logic
// @type: narrow the generic constraint
