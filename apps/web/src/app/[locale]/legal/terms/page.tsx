import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  description:
    "Mercato terms of service — open-source community price index on Celo.",
};

/**
 * Honest, plain-language terms for an open-source public-good project.
 *
 * Length matters: regulators / MiniPay reviewers want to confirm a
 * Terms link exists and is non-empty. Users want to understand the
 * rules in 30 seconds. We optimise for both — short clear sections
 * over a 20-page legal block that nobody reads.
 *
 * If the project pivots to anything that handles user funds, KYC, or
 * collects personal data, this file MUST be replaced by reviewed
 * legal copy. Today the contract only handles peer-verified public
 * price observations + a fixed-cap reward pool from the founder's
 * wallet — no custody, no fiat, no PII — so plain language is
 * sufficient.
 */
export default function TermsPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
        Legal
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight md:text-4xl">
        Terms of Service
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: May 2026.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            What Mercato is
          </h2>
          <p>
            Mercato is a community-built consumer-price index on the Celo
            blockchain. Anyone can submit a local price for an everyday
            product. Other contributors vote ✓ or ✗ on submissions. After
            three matching positive votes the submission is finalized
            and stored on-chain as a price observation. The full source
            code is MIT-licensed and lives at{" "}
            <Link
              href="https://github.com/BRN-SLP/mercato"
              target="_blank"
              className="text-primary hover:underline"
            >
              github.com/BRN-SLP/mercato
            </Link>
            .
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            No warranties
          </h2>
          <p>
            Mercato is provided as-is, with no warranties of any kind.
            The smart contract is immutable in its current logic — its
            source is verified on{" "}
            <Link
              href="https://celoscan.io/address/0x18DD82604a9439b3Cdb7E1078c355E460ED217Ed#code"
              target="_blank"
              className="text-primary hover:underline"
            >
              Celoscan
            </Link>{" "}
            so you can inspect it before interacting. You are responsible
            for any transaction you submit. We make no claim that any
            submitted price is accurate; consensus only proves that
            three peers agreed, not that the price reflects reality.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            Rewards
          </h2>
          <p>
            The contract pays small cUSD rewards to submitters and
            verifiers from a fixed seed pool funded by the project. The
            pool is finite. When it is depleted, the reward-distribution
            path inside the contract will revert with{" "}
            <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">
              InsufficientPoolBalance
            </code>
            ; submissions and verifications still work but no payouts
            occur. There is no guarantee of any specific reward amount
            or payout schedule.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            Acceptable use
          </h2>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              Submit prices you have actually observed. Spam, fraudulent
              or coordinated submissions are not welcome and will be
              voted down by the community.
            </li>
            <li>
              Do not attempt to attack, overload, or game the contract
              or this site. Security disclosures: open an issue on the
              GitHub repo above.
            </li>
            <li>
              All submitted price observations become public on-chain
              data the moment they are mined. Treat anything you publish
              as permanent and public.
            </li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            Open data
          </h2>
          <p>
            All price observations submitted via Mercato are released
            into the public domain (CC0). Anyone can read, copy, fork,
            or build on the data — that is the entire point of the
            project.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            Changes
          </h2>
          <p>
            These terms may change as the project evolves. The current
            version is always the one served at this URL.
          </p>
        </section>
      </div>
    </main>
  );
}
