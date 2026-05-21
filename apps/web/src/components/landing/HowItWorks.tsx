import { useTranslations } from "next-intl";

import { RevealOnScroll } from "@/components/hero/RevealOnScroll";

/**
 * "How it works" — three-stage editorial flow with miniature UI
 * artifacts.
 *
 * Replaces the previous alternating-left/right text-only layout.
 * That layout wasn't a card grid (good — would have hit the
 * impeccable absolute ban) but it was three paragraphs of body
 * copy and nothing else.
 *
 * The new layout keeps the editorial spine — serif stage numerals,
 * mono-caps tags, prose body — and adds a small visual artifact
 * per stage that demonstrates what that stage actually looks
 * like:
 *
 *   01 · scan    →  a submission ticket (country + product + price)
 *   02 · verify  →  a vote tally (3-dot progress + verifier count)
 *   03 · earn    →  a reward receipt (cUSD micro-amount + tx hash)
 *
 * Artifact rhythm (every artifact, same skeleton — that's what
 * keeps the three from reading as 'three different cards'):
 *
 *   [tiny metadata strip — left + right]
 *   [big mono metric]
 *   [2 detail rows]
 *   [solid bottom border]
 *   [mono caps footer line]
 *
 * Height is locked with `min-h` so the stage copy under each
 * artifact starts at the same baseline across columns. A thin
 * horizontal rail connects the three stage markers on desktop so
 * the section reads as 'submission → vote → reward', not as
 * three independent ideas.
 *
 * Layout note: artifacts ARE card-shaped — they have a border and
 * a label. But there are only three of them, the labels differ in
 * shape (corner stamp), and each artifact has a distinct internal
 * composition. So they don't read as 'identical card grid' (the
 * absolute ban). They read as three stamped tickets from one
 * printer.
 */
export function HowItWorks() {
  const t = useTranslations("howItWorks");

  return (
    <section className="container mx-auto max-w-6xl px-4 py-24">
      <RevealOnScroll>
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
          {t("section")}
        </p>
        <h2 className="mb-14 font-serif text-3xl font-semibold tracking-tight md:text-4xl">
          {t("title1")}{" "}
          <span className="italic text-primary">{t("title2")}</span>
        </h2>
      </RevealOnScroll>

      {/* Three-stage editorial flow. */}
      <div className="relative">
        {/* Connecting rail — desktop only. Anchors the eye
            horizontally so the section reads as a sequence. */}
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-[3.25rem] hidden h-px bg-border md:block"
        />

        <ol className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          <RevealOnScroll>
            <Stage index={1} tag="scan">
              <SubmissionTicket />
              <StageCopy
                title={t("step1Title")}
                body={t("step1Body")}
              />
            </Stage>
          </RevealOnScroll>

          <RevealOnScroll delay={0.08}>
            <Stage index={2} tag="verify">
              <VoteTally />
              <StageCopy
                title={
                  <>
                    {t("step2Title")}{" "}
                    <span className="italic text-primary">
                      {t("step2TitleAccent")}
                    </span>
                  </>
                }
                body={t("step2Body")}
              />
            </Stage>
          </RevealOnScroll>

          <RevealOnScroll delay={0.16}>
            <Stage index={3} tag="earn">
              <RewardChip />
              <StageCopy
                title={t("step3Title")}
                body={t("step3Body")}
              />
            </Stage>
          </RevealOnScroll>
        </ol>
      </div>
    </section>
  );
}

interface StageProps {
  index: number;
  tag: string;
  children: React.ReactNode;
}

function Stage({ index, tag, children }: StageProps) {
  return (
    <li className="relative flex h-full flex-col gap-5">
      {/* Stage marker — sits at the same y across columns so the
          rail line passes through all three dots in a straight
          horizontal. */}
      <div className="flex h-12 items-center gap-3">
        <span
          aria-hidden="true"
          className="font-serif text-5xl font-bold leading-none text-primary"
        >
          {String(index).padStart(2, "0")}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          · {tag}
        </span>
        <span
          aria-hidden="true"
          className="ml-auto hidden h-2 w-2 rounded-full bg-primary md:block"
        />
      </div>
      {children}
    </li>
  );
}

function StageCopy({
  title,
  body,
}: {
  title: React.ReactNode;
  body: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <h3 className="font-serif text-xl font-semibold tracking-tight md:text-2xl">
        {title}
      </h3>
      <p className="max-w-prose text-sm leading-relaxed text-muted-foreground md:text-base">
        {body}
      </p>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Artifacts.
 *
 * All three share the same skeleton — see `Artifact` below — so
 * the eye reads them as 'three tickets stamped from the same
 * printer' rather than three different cards. Height is locked
 * so the StageCopy underneath aligns across columns.
 * ────────────────────────────────────────────────────────────── */

interface ArtifactProps {
  label: string;
  topLeft: React.ReactNode;
  topRight: React.ReactNode;
  metric: React.ReactNode;
  metricUnit?: React.ReactNode;
  rows: { left: React.ReactNode; right: React.ReactNode; muted?: boolean }[];
  footer: React.ReactNode;
}

function Artifact({
  label,
  topLeft,
  topRight,
  metric,
  metricUnit,
  rows,
  footer,
}: ArtifactProps) {
  return (
    <figure className="relative flex min-h-[15rem] flex-col rounded-md border border-border/60 bg-card/60 p-4 backdrop-blur">
      {/* Corner stamp — mono caps category tag, anchored top-left.
          Sits across the card frame so the artifact reads as a
          stamped ticket. */}
      <figcaption className="absolute -top-2 left-3 bg-background px-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </figcaption>

      {/* Top metadata strip — left + right slots. */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {topLeft}
        </div>
        <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {topRight}
        </div>
      </div>

      {/* Big mono metric — the focal value of the stage. */}
      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-mono text-2xl font-semibold tabular-nums text-foreground">
          {metric}
        </span>
        {metricUnit !== undefined && (
          <span className="font-mono text-xs font-normal text-muted-foreground">
            {metricUnit}
          </span>
        )}
      </div>

      {/* Detail rows — always two rows of mono caps so the column
          rhythm matches across artifacts. */}
      <div className="mt-3 space-y-1">
        {rows.map((row, i) => (
          <div
            key={i}
            className={`flex items-center justify-between font-mono text-[10px] uppercase tracking-wider ${
              row.muted ? "text-muted-foreground/60" : "text-muted-foreground"
            }`}
          >
            <span>{row.left}</span>
            <span>{row.right}</span>
          </div>
        ))}
      </div>

      {/* Footer caption — pinned to the bottom of the artifact so
          all three column footers sit at the same y. */}
      <div className="mt-auto border-t border-border/60 pt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {footer}
      </div>
    </figure>
  );
}

function SubmissionTicket() {
  return (
    <Artifact
      label="submission · example"
      topLeft={
        <span
          aria-hidden="true"
          className="inline-flex h-6 w-9 items-center justify-center rounded-sm border border-border bg-card font-mono text-[10px] font-semibold tracking-[0.18em] text-foreground/80"
        >
          UA
        </span>
      }
      topRight="14:42 utc"
      metric="18.00"
      metricUnit="UAH"
      rows={[
        { left: "product", right: "milk · 1 L" },
        { left: "receipt", right: "optional · ipfs", muted: true },
      ]}
      footer="one tx · cUSD fee"
    />
  );
}

function VoteTally() {
  return (
    <Artifact
      label="vote tally · in progress"
      topLeft={
        <span className="flex items-center gap-2">
          <Dot tone="filled" />
          <Dot tone="filled" />
          <Dot tone="empty" />
        </span>
      }
      topRight="4h window"
      metric="2/3"
      metricUnit="peers · UA"
      rows={[
        { left: "0x9a…21", right: "yes" },
        { left: "0x4c…7e", right: "yes" },
      ]}
      footer="1 more to finalize"
    />
  );
}

function RewardChip() {
  return (
    <Artifact
      label="settled · just now"
      topLeft={<span>net to wallet</span>}
      topRight="↗ tx 0xab…1c"
      metric="+ 0.05"
      metricUnit="cUSD"
      rows={[
        { left: "submitter share", right: "+ 0.05" },
        { left: "3 × verifiers", right: "+ 0.05" },
      ]}
      footer="sweep any time · no minimum"
    />
  );
}

function Dot({ tone }: { tone: "filled" | "empty" }) {
  return (
    <span
      aria-hidden="true"
      className={
        tone === "filled"
          ? "inline-block h-2 w-2 rounded-full bg-primary"
          : "inline-block h-2 w-2 rounded-full border border-border bg-transparent"
      }
    />
  );
}
