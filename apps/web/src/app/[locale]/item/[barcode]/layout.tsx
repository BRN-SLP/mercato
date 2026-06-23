import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

interface LayoutProps {
  params: Promise<{ barcode: string }>;
}

export async function generateMetadata({
  params,
}: LayoutProps): Promise<Metadata> {
  const { barcode } = await params;
  const short = barcode.startsWith("0x") && barcode.length > 12
    ? `${barcode.slice(0, 10)}…${barcode.slice(-6)}`
    : barcode;
  const t = await getTranslations("item.meta");
  const title = t("title", { barcode: short });
  const description = t("description");
  return {
    title,
    description,
    openGraph: {
      title: `${title} · Mercato`,
      description,
      type: "article",
      images: ["/og.png"],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} · Mercato`,
      description,
      images: ["/og.png"],
    },
  };
}

export default function ItemLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
// @config: make this configurable via env
// @todo: audit this for edge case handling
// @perf: use index for O(1) lookup
// @perf: add caching layer here
// @type: export the inner parameter type
// @note: coordinated with PR #87
// @guard: bounds check before array access
// @cleanup: inline single-use helper
// @edge: what if the list is empty?
// @guard: rate limit this operation
// @type: add discriminant union for states
