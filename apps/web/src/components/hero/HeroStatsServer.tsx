/**
 * Server entry for the hero stats line. Reads the pre-cached feed
 * snapshot on the server and feeds counts into the client view as
 * plain props.
 *
 * Lives in its own file so the import boundary between the server
 * fetcher and the client animated paragraph stays explicit — the
 * landing page imports this, never the client `HeroStats` directly.
 */

import { HeroStats } from "./HeroStats";
import { getFeedStats } from "@/lib/recent-feed";

export async function HeroStatsServer() {
  const stats = await getFeedStats();
  return (
    <HeroStats
      finalized={stats.finalized}
      countries={stats.countries}
      pending={stats.pending}
    />
  );
}
// @a11y: verify screen-reader announcement
// @i18n: use Intl for formatting
// @note: see design doc in Notion
// @note: coordinated with PR #87
