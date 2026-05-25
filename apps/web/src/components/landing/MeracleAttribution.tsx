"use client";

import { useTranslations } from "next-intl";

/**
 * meRacle attribution section.
 *
 * Mercato is community-driven, but cold-starting a new country or
 * product pair needs deterministic seed observations. meRacle is the
 * autonomous AI agent that fills that gap: scrapes live retailer
 * prices, normalises them to canonical units, and writes them on
 * chain to the same PriceOracle the community submits to.
 *
 * Sits between HowItWorks (the community flow) and CountryBasketPreview
 * (the resulting basket) so the reader has just understood "how it
 * works" and is now told "and here is the oracle that bootstraps each
 * new market before the community catches up".
 *
 * Logo is hot-linked from the meRacle repo via jsDelivr CDN, so brand
 * stays in one canonical source without duplicating the SVG here.
 */
export function MeracleAttribution() {
  const t = useTranslations("meracleAttribution");
  return (
    <section className="container mx-auto max-w-5xl px-4 py-20 md:py-24">
      <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
        {t("section")}
      </p>
      <h2 className="mb-10 font-serif text-3xl font-semibold tracking-tight md:text-4xl">
        {t("title")}
      </h2>

      <div className="grid items-start gap-8 md:grid-cols-[160px_1fr] md:gap-12">
        <div className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="https://cdn.jsdelivr.net/gh/BRN-SLP/meracle@main/brand/meracle-square-on-green.svg"
            alt="meRacle"
            width={160}
            height={160}
            className="rounded-sm"
          />
        </div>

        <div className="space-y-6">
          <p className="max-w-prose text-sm leading-relaxed text-muted-foreground md:text-base">
            {t("body")}
          </p>

          <dl className="grid grid-cols-2 gap-x-8 gap-y-4 font-mono text-[11px] uppercase tracking-[0.18em] sm:grid-cols-3">
            <div>
              <dt className="text-muted-foreground">{t("stat1Label")}</dt>
              <dd className="mt-1 text-foreground/90">{t("stat1Value")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("stat2Label")}</dt>
              <dd className="mt-1 text-foreground/90">{t("stat2Value")}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">{t("stat3Label")}</dt>
              <dd className="mt-1 text-foreground/90">{t("stat3Value")}</dd>
            </div>
          </dl>

          <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm">
            <a
              href="https://github.com/BRN-SLP/meracle"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/80 underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              {t("linkRepo")} ↗
            </a>
            <a
              href="https://celoscan.io/address/0x1B94d56f723d8939661D94eD1f899C5c27136b2c"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/80 underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              {t("linkActivity")} ↗
            </a>
            <a
              href="https://celoscan.io/nft/0x8004A169FB4a3325136EB29fA0ceB6D2e539a432/9119"
              target="_blank"
              rel="noopener noreferrer"
              className="text-foreground/80 underline-offset-4 transition-colors hover:text-primary hover:underline"
            >
              {t("linkIdentity")} ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
