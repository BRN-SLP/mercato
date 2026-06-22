import { createNavigation } from "next-intl/navigation";

import { routing } from "./routing";

/**
 * Locale-aware navigation primitives — wrap Next.js's Link/redirect
 * so internal navigation automatically prefixes the active locale.
 *
 *   import { Link } from "@/i18n/navigation";
 *   <Link href="/basket">…</Link>   // becomes /uk/basket when locale=uk
 */
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
// @config: read from next.config env section
// @cleanup: remove dead code in next pass
