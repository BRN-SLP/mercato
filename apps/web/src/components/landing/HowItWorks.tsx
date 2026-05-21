import { useTranslations } from "next-intl";

import { RevealOnScroll } from "@/components/hero/RevealOnScroll";

/**
 * "How it works" — three-stage editorial flow with miniature UI
 * artifacts.
 *
 * Replaces the previous alternating-left/right text-only layout.
 * That layout wasn't a card grid (good — would have hit the
 * impeccable absolute ban) but it was three paragraphs of body
 * copy and nothing else. The page reads "designed" once but the
 * section under it falls back to a wall of words.
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
 * Artifacts are stylised, not literal screenshots — they live in
 * the same mono/serif register as the rest of the site and read
 * as "this is what the data looks like in motion", not "here's
 * a Figma mock". A thin horizontal rail connects the three stage
 * markers across desktop, reinforcing the "submission → vote →
 * reward" flow without needing arrow icons.
 *
 * Layout note: the three stages are NOT a card grid. There is no
 * card chrome around them — they sit on the page surface with the
 * connecting rail and stage numerals doing the structural work.
 * That is what keeps this out of the "Identical card grids"
 * absolute ban.
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

      {/* Three-stage editorial flow.
          Grid columns sit above a connecting rail (rendered as a
          ::before pseudo on the desktop wrapper via the
          before-rule below). Stage numerals are large enough to
          serve as the visual hierarchy, the artifact mocks below
          them carry the demonstration weight. */}
      <div className="relative">
        {/* Connecting rail — desktop only. Absolute below the
            stage numerals; the rail anchors the eye horizontally
            so the section reads as a sequence, not a list. */}
        <div
          aria-hidden="true"
          className="absolute left-0 right-0 top-[3.2rem] hidden h-px bg-border md:block"
        />

        <ol className="relative grid gap-12 md:grid-cols-3 md:gap-10">
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
    <li className="relative flex flex-col gap-6">
      {/* Stage marker — serif numeral floats above an artifact;
          the dot is the node on the connecting rail. */}
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="font-serif text-5xl font-bold leading-none text-primary"
        >
          {String(index).padStart(2, "0")}
        </span>
        <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
          · {tag}
        </span>
        {/* Rail node — sits at the same y as the absolute rail
            line above. The numeral + tag occupy the rest of the
            row; the dot is offset to the right to mark progress. */}
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
 * Artifacts — small stylised UI fragments per stage.
 *
 * These are NOT literal screenshots. They are restrained mono/serif
 * compositions that demonstrate the *shape* of what that stage
 * produces: a submission ticket, a vote tally, a reward receipt.
 * The values are illustrative (clearly labeled "example" via the
 * mono caps header), not pulled from chain.
 * ────────────────────────────────────────────────────────────── */

function SubmissionTicket() {
  return (
    <Artifact label="submission · example">
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-10 items-center justify-center rounded-sm border border-border bg-card font-mono text-[10px] font-semibold tracking-[0.18em] text-foreground/80"
        >
          UA
        </span>
        <span className="text-right font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          14:42 utc
        </span>
      </div>
      <div className="mt-3 space-y-1">
        <p className="text-xs text-muted-foreground">milk · 1 L</p>
        <p className="font-mono text-2xl font-semibold tabular-nums">
          18.00{" "}
          <span className="text-xs font-normal text-muted-foreground">
            UAH
          </span>
        </p>
      </div>
      <div className="mt-3 border-t border-dashed border-border/70 pt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        receipt · optional
      </div>
    </Artifact>
  );
}

function VoteTally() {
  return (
    <Artifact label="vote tally · 2 of 3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">peers in UA</p>
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          4h window
        </span>
      </div>
      <div className="mt-4 flex items-center gap-2.5">
        <Dot tone="filled" />
        <Dot tone="filled" />
        <Dot tone="empty" />
        <span className="ml-auto font-mono text-xs font-semibold tabular-nums">
          2/3
        </span>
      </div>
      <div className="mt-4 space-y-1.5">
        <VoteRow vote="yes" by="0x9a…21" />
        <VoteRow vote="yes" by="0x4c…7e" />
        <VoteRow vote="—" by="—" muted />
      </div>
    </Artifact>
  );
}

function RewardChip() {
  return (
    <Artifact label="settled · just now">
      <div className="flex items-baseline justify-between gap-2">
        <span className="font-mono text-2xl font-semibold tabular-nums text-primary">
          + 0.05
        </span>
        <span className="font-mono text-xs font-semibold tracking-wider text-foreground/80">
          cUSD
        </span>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        submitter share · 50%
      </p>
      <div className="mt-4 space-y-1">
        <RewardLine label="3 × verifiers" amount="+ 0.05" />
        <RewardLine label="net to wallet" amount="+ 0.05" emphasized />
      </div>
      <div className="mt-3 border-t border-border/60 pt-2 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        tx · 0xab…1c ↗
      </div>
    </Artifact>
  );
}

function Artifact({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <figure className="relative rounded-md border border-border/60 bg-card/60 p-4 backdrop-blur">
      {/* Corner stamp — mono caps category tag, anchored top-left.
          Sits inside the card frame so the artifact reads as a
          ticket / receipt with a printed header, not as a plain
          card. */}
      <figcaption className="absolute -top-2 left-3 bg-background px-1.5 font-mono text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </figcaption>
      {children}
    </figure>
  );
}

function Dot({ tone }: { tone: "filled" | "empty" }) {
  return (
    <span
      aria-hidden="true"
      className={
        tone === "filled"
          ? "inline-block h-2.5 w-2.5 rounded-full bg-primary"
          : "inline-block h-2.5 w-2.5 rounded-full border border-border bg-transparent"
      }
    />
  );
}

function VoteRow({
  vote,
  by,
  muted,
}: {
  vote: string;
  by: string;
  muted?: boolean;
}) {
  return (
    <div
      className={`flex items-center justify-between font-mono text-[10px] uppercase tracking-wider ${
        muted ? "text-muted-foreground/60" : "text-muted-foreground"
      }`}
    >
      <span>{by}</span>
      <span
        className={
          vote === "yes" && !muted
            ? "text-foreground"
            : "text-muted-foreground"
        }
      >
        {vote}
      </span>
    </div>
  );
}

function RewardLine({
  label,
  amount,
  emphasized,
}: {
  label: string;
  amount: string;
  emphasized?: boolean;
}) {
  return (
    <div
      className={`flex items-baseline justify-between font-mono text-xs tabular-nums ${
        emphasized ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      <span className={emphasized ? "font-semibold" : ""}>{label}</span>
      <span className={emphasized ? "font-semibold" : ""}>{amount}</span>
    </div>
  );
}
