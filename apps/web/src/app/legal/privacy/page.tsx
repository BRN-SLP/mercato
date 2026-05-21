import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description:
    "Mercato privacy policy — what we collect, what we don't, and what's permanent on-chain.",
};

/**
 * Honest privacy disclosure for an open-source public-good app.
 *
 * Mercato by design collects no personal data on its servers — the
 * web app is read-mostly Next.js, all writes go directly from the
 * user's wallet to the on-chain contract. The two things that ARE
 * permanent + public are (1) wallet addresses on Celo and (2) the
 * price observations themselves. Both are inherent to the public
 * blockchain model.
 *
 * Vercel adds standard infrastructure logging (IP, user agent,
 * request path) which we don't read or export — disclosed honestly
 * below so reviewers can confirm.
 */
export default function PrivacyPage() {
  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
        Legal
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight md:text-4xl">
        Privacy Policy
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Last updated: May 2026.
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            What we collect
          </h2>
          <p>
            We do not run any user accounts, email lists, analytics
            trackers, or third-party advertising scripts. We do not
            ask for your name, phone number, location, or any other
            personal identifier. The web app is a thin client over the
            on-chain contract.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            What is public on-chain
          </h2>
          <p>
            Two things become permanent, public, and unalterable the
            moment you submit a transaction:
          </p>
          <ul className="ml-5 list-disc space-y-2">
            <li>
              <strong className="text-foreground">
                Your wallet address.
              </strong>{" "}
              Every blockchain transaction includes it by design. If
              your wallet is otherwise linked to your real-world
              identity, that link applies here too.
            </li>
            <li>
              <strong className="text-foreground">
                Your submitted price observations and votes.
              </strong>{" "}
              Product slug, country code, price in cents, optional
              receipt-image hash, timestamp, and which submissions you
              verified. This is the project&apos;s whole point — open
              data for an open cost-of-living index.
            </li>
          </ul>
          <p>
            We cannot delete on-chain data on your behalf. No one can.
            Treat anything you submit as permanent and public.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            Hosting infrastructure
          </h2>
          <p>
            The site is hosted on Vercel, which (like every web host)
            processes request metadata such as IP address, user agent,
            and request path to deliver the page. We do not read,
            export, or otherwise process those logs ourselves. See{" "}
            <Link
              href="https://vercel.com/legal/privacy-policy"
              target="_blank"
              className="text-primary hover:underline"
            >
              Vercel&apos;s privacy policy
            </Link>{" "}
            for their handling.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            Cookies
          </h2>
          <p>
            Mercato does not set its own cookies. Your wallet provider
            (e.g. MiniPay, MetaMask, Rainbow) may store state in your
            browser as part of normal wallet operation; that storage
            is controlled by your wallet, not by us.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            RPC and explorer queries
          </h2>
          <p>
            The site reads on-chain data through public RPC endpoints
            (Celo Forno) and may link to public block explorers
            (Celoscan, Blockscout). Those services see standard
            request metadata; the same disclosure as Vercel above
            applies.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            Receipt photos
          </h2>
          <p>
            When a user attaches a receipt photo to a submission, the
            image is stored on Vercel Blob storage and
            content-addressed by hash; the hash is also stored
            on-chain. Photos are only fetched when someone views that
            specific submission. Photos can&apos;t be removed once the
            on-chain hash exists.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            Contact
          </h2>
          <p>
            For privacy questions, security disclosures, or removal
            requests for off-chain content (the receipt photos
            mentioned above), open an issue on the{" "}
            <Link
              href="https://github.com/BRN-SLP/mercato/issues"
              target="_blank"
              className="text-primary hover:underline"
            >
              project repository
            </Link>
            .
          </p>
        </section>
      </div>
    </main>
  );
}
