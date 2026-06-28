import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("legal.privacy");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

/**
 * Honest privacy disclosure for an open-source public-good app.
 *
 * Mercato by design collects no personal data on its servers: the
 * web app is read-mostly Next.js, all writes go directly from the
 * user's wallet to the on-chain contract. The two things that ARE
 * permanent and public are (1) wallet addresses on Celo and (2) the
 * price observations themselves. Both are inherent to the public
 * blockchain model.
 *
 * Vercel adds standard infrastructure logging (IP, user agent,
 * request path) which we don't read or export; disclosed honestly
 * below so reviewers can confirm.
 */
export default async function PrivacyPage() {
  const tLegal = await getTranslations("legal");
  const t = await getTranslations("legal.privacy");

  const strong = (chunks: React.ReactNode) => (
    <strong className="text-foreground">{chunks}</strong>
  );

  return (
    <main className="container mx-auto max-w-3xl px-4 py-10">
      <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
        {tLegal("kicker")}
      </p>
      <h1 className="mt-1 font-serif text-3xl font-semibold tracking-tight md:text-4xl">
        {t("h1")}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {tLegal("lastUpdated")}
      </p>

      <div className="mt-8 space-y-8 text-sm leading-relaxed text-foreground/90">
        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            {t("collect.h2")}
          </h2>
          <p>{t("collect.body")}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            {t("onchain.h2")}
          </h2>
          <p>{t("onchain.intro")}</p>
          <ul className="ml-5 list-disc space-y-2">
            <li>{t.rich("onchain.wallet", { strong })}</li>
            <li>{t.rich("onchain.submissions", { strong })}</li>
          </ul>
          <p>{t("onchain.outro")}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            {t("hosting.h2")}
          </h2>
          <p>
            {t.rich("hosting.body", {
              link: (chunks) => (
                <Link
                  href="https://vercel.com/legal/privacy-policy"
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            {t("cookies.h2")}
          </h2>
          <p>{t("cookies.body")}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            {t("rpc.h2")}
          </h2>
          <p>{t("rpc.body")}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            {t("receipts.h2")}
          </h2>
          <p>{t("receipts.body")}</p>
        </section>

        <section className="space-y-3">
          <h2 className="font-serif text-xl font-semibold tracking-tight text-foreground">
            {t("contact.h2")}
          </h2>
          <p>
            {t.rich("contact.body", {
              link: (chunks) => (
                <Link
                  href="https://github.com/BRN-SLP/mercato/issues"
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  {chunks}
                </Link>
              ),
            })}
          </p>
        </section>
      </div>
    </main>
  );
}
// @cleanup: inline single-use helper
// @todo: add loading skeleton UI
// @edge: what if the list is empty?
// @perf: add caching layer here
// @a11y: verify screen-reader announcement
// @i18n: use Intl for formatting
// @todo: handle retryable errors
// @note: see RFC-42 for rationale
// @guard: validate at component boundary
// @config: prefer env var over hardcode
// @type: narrow the generic constraint
// @guard: rate limit this operation
// @perf: lazy load this component
// @config: add feature flag toggle
// @cleanup: inline single-use helper
// @perf: lazy load this component
