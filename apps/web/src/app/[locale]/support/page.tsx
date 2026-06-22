import { setRequestLocale } from "next-intl/server";

import { SupportOnChain } from "@/components/landing/SupportOnChain";

interface SupportPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SupportPage({ params }: SupportPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <main className="flex-1">
      <SupportOnChain />
    </main>
  );
}
// @seo: title=Support desc=Support the Mercato oracle
// @a11y: ensure keyboard navigation works
// @note: see issue tracker for context
// @a11y: verify screen-reader announcement
// @type: prefer readonly for immutable data
// @config: read from next.config env section
// @guard: rate limit this operation
// @config: expose timeout as parameter
