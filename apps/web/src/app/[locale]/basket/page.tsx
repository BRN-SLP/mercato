import Link from "next/link";
import { ArrowLeft, ShoppingBasket } from "lucide-react";

import { CountryMark } from "@/components/brand/CountryMark";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  getBasketSnapshot,
  type CountryBasket,
  type ProductPriceSummary,
} from "@/lib/aggregate";
import { formatMajor } from "@/lib/format-cents";
import { CATEGORY_LABELS, PRODUCTS, type ProductCategory } from "@/lib/products";

/**
 * Cost-of-living dashboard at `/basket`.
 *
 * Two modes, switched by the `?country=XX` query param:
 *
 *   - INDEX (no param) — table of every launch country sorted by
 *     coverage descending, each row linkable into that country's
 *     detailed breakdown.
 *   - DETAIL (?country=XX) — per-category product table for one
 *     country showing the median price + sample size + how recent the
 *     last contributing submission is.
 *
 * Both modes server-render off the same cached snapshot
 * (`getBasketSnapshot`) — no client fetching, no skeletons, page
 * shows the freshest data Forno had within the last 60 seconds.
 */

interface BasketPageProps {
  searchParams: Promise<{ country?: string | string[] }>;
}

export default async function BasketPage({ searchParams }: BasketPageProps) {
  const params = await searchParams;
  const rawCountry = Array.isArray(params.country)
    ? params.country[0]
    : params.country;
  const selectedCode = rawCountry?.trim().toUpperCase();

  const snapshot = await getBasketSnapshot();

  if (snapshot.countries.length === 0 || snapshot.countries.every((b) => b.coverage === 0)) {
    return <EmptyState />;
  }

  const selected = selectedCode
    ? snapshot.countries.find((b) => b.country.code === selectedCode)
    : undefined;

  if (selected) {
    return <CountryDetail basket={selected} />;
  }

  return <CountryIndex baskets={snapshot.countries} />;
}

function CountryIndex({ baskets }: { baskets: readonly CountryBasket[] }) {
  // Show all countries — including zero-coverage ones at the bottom —
  // so contributors see what's missing and can fill gaps.
  const ranked = [...baskets].sort((a, b) => {
    if (b.coverage !== a.coverage) return b.coverage - a.coverage;
    return a.country.name.localeCompare(b.country.name);
  });

  return (
    <main className="container mx-auto max-w-5xl px-4 py-12">
      <header className="mb-10">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
          Cost-of-living index
        </p>
        <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">
          The Mercato basket,{" "}
          <span className="italic text-primary">country by country.</span>
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-muted-foreground md:text-base">
          Daily median prices submitted and verified by the community. Each
          basket sums the median price for {PRODUCTS.length} canonical goods —
          bread, rent, transport, utilities — in local currency. Click a row
          for the per-product breakdown.
        </p>
      </header>

      {/* Column header strip — sits OUTSIDE the row container so the
          row list reads as a divider-rhythm chart, not a primitive
          table-in-a-box. */}
      <div className="grid grid-cols-[3rem_1fr_8rem_auto] items-baseline gap-x-6 border-b border-border/60 px-3 pb-3 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        <span aria-hidden="true">№</span>
        <span>Country</span>
        <span className="text-right">Coverage</span>
        <span className="text-right">Basket total</span>
      </div>

      <ol className="divide-y divide-border/60 border-b border-border/60">
        {ranked.map((basket, i) => (
          <CountryRow
            key={basket.country.code}
            basket={basket}
            rank={i + 1}
          />
        ))}
      </ol>
    </main>
  );
}

function CountryRow({
  basket,
  rank,
}: {
  basket: CountryBasket;
  rank: number;
}) {
  const hasData = basket.coverage > 0;
  const total = formatMajor(basket.totalLocalCents);
  const coveragePct = Math.max(
    hasData ? 4 : 0,
    (basket.coverage / PRODUCTS.length) * 100,
  );

  return (
    <li className={hasData ? "group" : "opacity-50"}>
      <Link
        href={`/basket?country=${basket.country.code}`}
        className="grid grid-cols-[3rem_1fr_8rem_auto] items-center gap-x-6 px-3 py-4 transition hover:bg-primary/[0.04] focus-visible:bg-primary/[0.06] focus-visible:outline-none"
        aria-label={`${basket.country.name}: ${basket.coverage} of ${PRODUCTS.length} products priced`}
      >
        {/* Rank */}
        <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
          {String(rank).padStart(2, "0")}
        </span>

        {/* Country mark + name */}
        <span className="flex min-w-0 items-center gap-3">
          <CountryMark code={basket.country.code} size="md" />
          <span className="truncate font-medium">{basket.country.name}</span>
        </span>

        {/* Coverage with thin progress underline */}
        <span className="flex items-center justify-end gap-2 font-mono text-xs tabular-nums">
          <span
            aria-hidden="true"
            className="relative h-px w-16 bg-border/50"
          >
            <span
              className="absolute inset-y-0 left-0 -top-px h-[3px] bg-primary/70 group-hover:bg-primary"
              style={{ width: `${coveragePct}%` }}
            />
          </span>
          <span className="text-muted-foreground">
            {basket.coverage}/{PRODUCTS.length}
          </span>
        </span>

        {/* Basket total + affordance hint */}
        <span className="flex flex-col items-end gap-0.5 text-right font-mono tabular-nums">
          {hasData ? (
            <>
              <span className="text-sm font-semibold">
                {total}{" "}
                <span className="text-[10px] font-normal uppercase tracking-wider text-muted-foreground">
                  {basket.country.currency}
                </span>
              </span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                view →
              </span>
            </>
          ) : (
            <>
              <span className="text-sm text-muted-foreground">—</span>
              <span className="text-[10px] uppercase tracking-wider text-primary/80">
                be first →
              </span>
            </>
          )}
        </span>
      </Link>
    </li>
  );
}

function CountryDetail({ basket }: { basket: CountryBasket }) {
  // Group products by category for the breakdown table.
  const byCategory = new Map<ProductCategory, ProductPriceSummary[]>();
  for (const p of basket.prices) {
    const arr = byCategory.get(p.product.category) ?? [];
    arr.push(p);
    byCategory.set(p.product.category, arr);
  }

  return (
    <main className="container mx-auto max-w-5xl px-4 py-12">
      <Link
        href="/basket"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
        Back to index
      </Link>

      <header className="mb-10 space-y-4">
        <div className="flex items-center gap-3">
          {/* Country mark — desaturated flag + ISO pill, large size
              so the country reads as the page identity. */}
          <CountryMark code={basket.country.code} size="lg" />
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
            {basket.country.currency} · cost-of-living
          </p>
        </div>
        <h1 className="font-serif text-4xl font-bold tracking-tight md:text-5xl">
          {basket.country.nameLocal ?? basket.country.name}
        </h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Median basket total of{" "}
          <strong>
            {formatMajor(basket.totalLocalCents)} {basket.country.currency}
          </strong>{" "}
          across {basket.coverage} of {PRODUCTS.length} canonical products.
        </p>
      </header>

      {basket.coverage === 0 ? (
        <Card className="border-dashed">
          <CardContent className="px-6 py-12 text-center">
            <div
              aria-hidden="true"
              className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary"
            >
              <ShoppingBasket className="h-6 w-6" />
            </div>
            <h2 className="font-serif text-2xl font-semibold">
              No prices in{" "}
              <span className="italic text-primary">
                {basket.country.name}
              </span>{" "}
              yet
            </h2>
            <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
              The basket here is empty. Be the first to add a price.
            </p>
            <Link
              href="/scan"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
            >
              Add a price →
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {(
            Object.keys(CATEGORY_LABELS) as ProductCategory[]
          ).map((category) => {
            const products = byCategory.get(category);
            if (!products || products.length === 0) return null;
            return (
              <CategorySection
                key={category}
                label={CATEGORY_LABELS[category]}
                products={products}
                currency={basket.country.currency}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}

function CategorySection({
  label,
  products,
  currency,
}: {
  label: string;
  products: ProductPriceSummary[];
  currency: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-border/60">
            {products.map((p) => {
              const hasData = p.sampleSize > 0;
              return (
                <tr
                  key={p.product.slug}
                  className={hasData ? "" : "opacity-50"}
                >
                  <td className="px-6 py-3">
                    <div className="font-medium">{p.product.label}</div>
                    {p.product.hint && (
                      <div className="text-xs text-muted-foreground">
                        {p.product.hint}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right font-mono tabular-nums">
                    {hasData ? (
                      <>
                        {formatMajor(p.medianCents)}{" "}
                        <span className="text-xs text-muted-foreground">
                          {currency}
                        </span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-right font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {hasData
                      ? `${p.sampleSize} ${p.sampleSize === 1 ? "sub" : "subs"}`
                      : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-24">
      <div className="rounded-md border border-dashed border-border/80 bg-card/40 px-6 py-16 text-center">
        <div
          aria-hidden="true"
          className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary"
        >
          <ShoppingBasket className="h-7 w-7" />
        </div>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
          The basket is empty
        </p>
        <h1 className="font-serif text-3xl font-bold tracking-tight md:text-4xl">
          No prices have been submitted{" "}
          <span className="italic text-primary">yet.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-md text-sm text-muted-foreground">
          Mercato launches at zero submissions in every country. Pick a
          product, pick your country, type a price — the index starts
          building itself.
        </p>
        <Link
          href="/scan"
          className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          Add the first price →
        </Link>
      </div>
    </main>
  );
}

