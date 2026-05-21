/* eslint-disable @next/next/no-img-element */

/**
 * Mercato brand mark.
 *
 * Two variants:
 *   - `icon`     — basket only, 1:1 square. Used in the navbar and as
 *                  a general-purpose icon mark.
 *   - `wordmark` — "Mercato" hand-drawn wordmark + basket as the
 *                  final "o". Used in landing hero, footer, share
 *                  cards, OG image.
 *
 * Theming
 *   The hand-painted SVG fills are baked into the source files (the
 *   brush textures rely on specific cream + green hex pairs, so a
 *   `currentColor` swap would flatten the look). Instead we ship both
 *   the cream-on-transparent and green-on-transparent versions and
 *   toggle visibility via Tailwind `dark:` classes — the right ink
 *   shows on the right surface automatically.
 *
 * Why <img>, not next/image
 *   next/image requires explicit width AND height as numbers and
 *   forces a fixed intrinsic aspect ratio. Our consumers pass varied
 *   sizes via `className` (h-9, h-12, h-56, etc) and want the SVG to
 *   scale fluidly. Plain <img> + Tailwind `h-* w-auto` gives us that.
 */

import { cn } from "@/lib/utils";

type MercatoLogoVariant = "icon" | "wordmark";

interface MercatoLogoProps {
  variant?: MercatoLogoVariant;
  className?: string;
  /**
   * If provided, the rendered image uses this as alt text. Omit when
   * the enclosing element already owns the accessible name (e.g. the
   * navbar Link with aria-label="Mercato — home") to avoid double
   * announcement by screen readers.
   */
  ariaLabel?: string;
}

const ICON_SRC = "/brand/mercato-basket-green.png";
const WORDMARK_GREEN_SRC = "/brand/mercato-wordmark-green.svg";
const WORDMARK_CREAM_SRC = "/brand/mercato-wordmark-cream.svg";

export function MercatoLogo({
  variant = "icon",
  className,
  ariaLabel,
}: MercatoLogoProps) {
  const alt = ariaLabel ?? "";
  const isDecorative = !ariaLabel;

  if (variant === "wordmark") {
    return (
      <>
        {/* Light theme — green ink on whatever cream background the
            parent renders. */}
        <img
          src={WORDMARK_GREEN_SRC}
          alt={alt}
          aria-hidden={isDecorative}
          className={cn("inline-block w-auto dark:hidden", className)}
        />
        {/* Dark theme — cream ink on whatever deep-green background
            the parent renders. */}
        <img
          src={WORDMARK_CREAM_SRC}
          alt={alt}
          aria-hidden={isDecorative}
          className={cn("hidden w-auto dark:inline-block", className)}
        />
      </>
    );
  }

  // Icon variant — basket only, green-on-transparent.
  // Same file is used by the favicon, OG, and navbar mark so the
  // brand signal is identical across surfaces.
  return (
    <img
      src={ICON_SRC}
      alt={alt}
      aria-hidden={isDecorative}
      className={cn("inline-block w-auto", className)}
    />
  );
}
