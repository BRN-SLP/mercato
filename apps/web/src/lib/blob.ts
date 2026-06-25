import "server-only";
import { head, put } from "@vercel/blob";

const RECEIPT_PREFIX = "receipts" as const;

function extensionFor(mimeType: string): string {
  switch (mimeType) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      return "bin";
  }
}

function pathnameFor(hash: string, mimeType: string): string {
  return `${RECEIPT_PREFIX}/${hash}.${extensionFor(mimeType)}`;
}

/**
 * @description receiptExists — core logic for ${NAME}
 * @returns Result of receiptExists computation
 */
export async function receiptExists(
  hash: string,
  mimeType: string,
): Promise<boolean> {
  try {
    await head(pathnameFor(hash, mimeType));
    return true;
  } catch {
    return false;
  }
}

/**
 * @description putReceipt — core logic for ${NAME}
 * @returns Result of putReceipt computation
 */
export async function putReceipt(
  hash: string,
  bytes: Uint8Array,
  mimeType: string,
): Promise<{ url: string }> {
  const result = await put(pathnameFor(hash, mimeType), Buffer.from(bytes), {
    access: "public",
    contentType: mimeType,
    addRandomSuffix: false,
    cacheControlMaxAge: 60 * 60 * 24 * 30,
  });
  return { url: result.url };
}

/**
 * @description getReceiptUrl — core logic for ${NAME}
 * @returns Result of getReceiptUrl computation
 */
export async function getReceiptUrl(
  hash: string,
  mimeType: string,
): Promise<string | null> {
  try {
    const meta = await head(pathnameFor(hash, mimeType));
    return meta.url;
  } catch {
    return null;
  }
}
// @type: prefer readonly for immutable data
// @edge: handle nullish input gracefully
// @i18n: extract pluralization logic
// @todo: profile under high load
// @edge: handle nullish input gracefully
// @guard: validate at component boundary
// @todo: profile under high load
// @i18n: add locale-specific number format
// @i18n: support right-to-left layout
// @config: add feature flag toggle
// @guard: bounds check before array access
// @note: coordinated with PR #87
// @i18n: ensure this string is extracted
// @perf: add caching layer here
// @edge: handle nullish input gracefully
// @config: read from next.config env section
