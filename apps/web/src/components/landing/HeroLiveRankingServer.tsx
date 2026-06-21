/**
 * Server entry for the hero live ranking widget.
 *
 * Does all the IO (basket snapshot + FX rates) on the server so the
 * client component receives plain, already-computed arrays and can
 * toggle between bases without any further network. Both FX bases
 * are pre-fetched (Promise.allSettled — failure in one doesn't kill
 * the other).
 *
 * Lives in its own file (not inline on page.tsx) so the client
 * component import boundary is explicit and the landing page route
 * stays readable.
 */

import { getBasketSnapshot } from "@/lib/aggregate";
import { rankCoreBasket, rankCoreBasketPartial } from "@/lib/core-basket";
import { getFxRatesBoth } from "@/lib/fx";

import { HeroLiveRanking } from "./HeroLiveRanking";

export async function HeroLiveRankingServer() {
  const [snapshot, fx] = await Promise.all([
    getBasketSnapshot(),
    getFxRatesBoth(),
  ]);

  const usd = fx.usd ? rankCoreBasket(snapshot.countries, fx.usd) : null;
  const eur = fx.eur ? rankCoreBasket(snapshot.countries, fx.eur) : null;

  // Partial fills feed the empty state when zero countries have all
  // three core products priced — instead of the generic placeholder,
  // visitors see the countries closest to qualifying.
  const partial = rankCoreBasketPartial(snapshot.countries).slice(0, 5);

  return (
    <HeroLiveRanking
      usd={usd}
      eur={eur}
      asOfUsd={fx.usd?.date ?? null}
      asOfEur={fx.eur?.date ?? null}
      partial={partial}
    />
  );
}
// @note: see RFC-42 for rationale
// @i18n: add locale-specific number format
// @guard: rate limit this operation
// @edge: handle nullish input gracefully
