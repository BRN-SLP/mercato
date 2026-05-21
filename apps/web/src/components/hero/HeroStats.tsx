/**
 * Live stats for the hero — one editorial sentence, three numbers.
 *
 * Refactored away from the "hero-metric template" (3-column grid of
 * big-number / small-label cards), which is the impeccable absolute
 * ban and a premium-web-design Pillar 1 red flag — "looks templated".
 *
 * The replacement reads like a newspaper byline: tabular numerals
 * carry the data weight, mono-uppercase labels space them, the whole
 * line sits inline with the rest of the hero copy.
 *
 * Counts are pre-computed on the server (see `HeroStatsServer`) and
 * passed in as plain props so the hero ships pre-filled — no
 * mount-time RPC, no layout shift.
 *
 * The entrance fade-from-below was removed: SSR already shows the
 * final numbers, so animating from `y: 8` to `y: 0` on hydration
 * just makes the hero feel like it's bouncing into place. The
 * count-up animation inside `CountUp` is still optional — kicks in
 * once on mount, respects prefers-reduced-motion.
 */
interface HeroStatsProps {
  finalized: number;
  countries: number;
  pending: number;
}

export function HeroStats({ finalized, countries, pending }: HeroStatsProps) {
  return (
    <p className="flex flex-wrap items-baseline gap-x-5 gap-y-2 border-y border-primary/15 py-4">
      <Stat n={finalized} label="prices verified" />
      <Bullet />
      <Stat n={countries} label="countries live" />
      <Bullet />
      <Stat n={pending} label="awaiting peer vote" subdued={pending === 0} />
    </p>
  );
}

function Stat({
  n,
  label,
  subdued = false,
}: {
  n: number;
  label: string;
  subdued?: boolean;
}) {
  return (
    <span className="inline-flex items-baseline gap-2">
      <span
        className={`font-serif text-3xl font-semibold tabular-nums tracking-tight ${
          subdued ? "text-muted-foreground/70" : "text-foreground"
        }`}
      >
        {n.toLocaleString()}
      </span>
      <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {label}
      </span>
    </span>
  );
}

function Bullet() {
  return (
    <span aria-hidden="true" className="text-primary/30">
      ·
    </span>
  );
}

/* CountUp was removed: the animation re-kicked the digits back to 0
 * on hydration and counted up to the SSR value, which read as the
 * hero "jumping" into place every page load. SSR already paints the
 * final numbers — that's enough. */
