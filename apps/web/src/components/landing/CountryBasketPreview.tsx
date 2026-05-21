import Link from "next/link";
import { ArrowRight, ShoppingBasket } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getBasketSnapshot, type CountryBasket } from "@/lib/aggregate";
import { PRODUCTS } from "@/lib/products";

/**
 * Top-N country basket preview for the landing page.
 *
 * Server component — pulls the cached `getBasketSnapshot()` and ranks
 * countries by coverage (number of products with >= 1 submission).
 * "Most data" beats "highest basket" or "lowest basket" as a ranking
 * key for a launch-phase index: coverage signals "this country has a
 * working community" which is the social proof we want to surface.
 *
 * Falls back to a friendly empty state when no Mercato-format
 * submissions are on chain yet (every launch starts here).
 */
const TOTAL_PRODUCTS = PRODUCTS.length;
const LIMIT = 6;

export async function CountryBasketPreview() {
  const snapshot = await getBasketSnapshot();
  // Rank by coverage descending, tie-break by totalLocalCents
  // (mostly stable since totals across different currencies aren't
  // directly comparable — the tie-break is more about determinism
  // than meaning).
  const ranked = [...snapshot.countries]
    .filter((b) => b.coverage > 0)
    .sort((a, b) => {
      if (b.coverage !== a.coverage) return b.coverage - a.coverage;
      return b.totalLocalCents > a.totalLocalCents ? 1 : -1;
    })
    .slice(0, LIMIT);

  if (ranked.length === 0) {
    return <BasketEmptyState />;
  }

  return (
    <section className="container mx-auto max-w-5xl px-4 py-20">
      <div className="mb-10 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            The basket so far
          </p>
          <h2 className="font-serif text-3xl font-semibold tracking-tight md:text-4xl">
            Countries leading <span className="italic text-primary">on coverage.</span>
          </h2>
        </div>
        <Link
          href="/basket"
          className="hidden items-center gap-1.5 text-sm font-medium text-primary hover:underline sm:inline-flex"
        >
          See full index
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ranked.map((basket) => (
          <CountryCard key={basket.country.code} basket={basket} />
        ))}
      </div>

      <div className="mt-8 sm:hidden">
        <Link
          href="/basket"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          See full index
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}

function CountryCard({ basket }: { basket: CountryBasket }) {
  const totalMajor = formatMajor(basket.totalLocalCents);
  return (
    <Link
      href={`/basket?country=${basket.country.code}`}
      className="group block focus-visible:outline-none"
      aria-label={`See ${basket.country.name} basket details`}
    >
      <Card className="h-full border-border/60 transition group-hover:-translate-y-0.5 group-hover:border-primary/40 group-hover:shadow-md group-hover:shadow-primary/10 group-focus-visible:ring-2 group-focus-visible:ring-primary group-focus-visible:ring-offset-2">
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2 font-serif text-xl">
              <span className="text-2xl leading-none" aria-hidden="true">
                {basket.country.flag}
              </span>
              <span>{basket.country.name}</span>
            </CardTitle>
            <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {basket.coverage}/{TOTAL_PRODUCTS}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="font-mono text-2xl font-semibold tracking-tight">
            {totalMajor}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              {basket.country.currency}
            </span>
          </p>
          <p className="text-xs text-muted-foreground">
            Median basket value across {basket.coverage}{" "}
            {basket.coverage === 1 ? "product" : "products"}.
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function BasketEmptyState() {
  return (
    <section className="container mx-auto max-w-3xl px-4 py-20">
      <div className="rounded-md border border-dashed border-border/80 bg-card/40 px-6 py-12 text-center">
        <div
          aria-hidden="true"
          className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <ShoppingBasket className="h-6 w-6" />
        </div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
          The basket is empty
        </p>
        <h2 className="font-serif text-2xl font-semibold tracking-tight md:text-3xl">
          No country has been priced{" "}
          <span className="italic text-primary">yet.</span>
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
          Mercato launches at zero submissions. Be the first to add a price
          in your country — the rest of the basket builds itself.
        </p>
        <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
          <Link href="/scan" className="inline-flex items-center gap-1.5 hover:underline">
            Add a price
            <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

/**
 * Format a price-cents BigInt to a major-unit string with up to 2
 * decimal places, grouping thousands. Output examples:
 *   1_234_500n → "12 345"
 *   1_234_567n → "12 345.67"
 *   123n       → "1.23"
 * Uses thin-space grouping (U+202F) which renders cleanly in most
 * languages and matches the editorial-mono feel of the dashboard.
 */
function formatMajor(cents: bigint): string {
  if (cents === 0n) return "0";
  const major = cents / 100n;
  const remainder = cents % 100n;
  const grouped = major.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  if (remainder === 0n) return grouped;
  return `${grouped}.${remainder.toString().padStart(2, "0")}`;
}
