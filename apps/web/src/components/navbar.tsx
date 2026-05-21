"use client";

import { useTranslations } from "next-intl";
import { Menu, ExternalLink } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ConnectButton } from "@/components/connect-button";
import { MercatoLogo } from "@/components/brand/MercatoLogo";
import { ThemeToggle } from "@/components/theme-toggle";
import { Link, usePathname } from "@/i18n/navigation";

interface NavLink {
  /** Translation key under nav.* */
  key: "home" | "basket" | "submit" | "rewards";
  href: string;
  external?: boolean;
}

// Routes — `/scan` is the legacy submit-a-price URL kept stable so
// existing deep links continue to resolve; the label maps via i18n.
// Order: Home → Basket (read) → Submit (write) → Rewards (claim) —
// follows the user journey arc.
const navLinks: NavLink[] = [
  { key: "home", href: "/" },
  { key: "basket", href: "/basket" },
  { key: "submit", href: "/scan" },
  { key: "rewards", href: "/rewards" },
];

export function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 max-w-screen-2xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          {/* Mobile menu — h-11 w-11 enforces 44px touch target (WCAG 2.5.5) */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11 md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">{t("menu")}</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <div className="mb-8 flex items-center gap-3 text-primary">
                <MercatoLogo variant="icon" className="h-8 w-8" />
                <span className="font-serif text-xl font-semibold italic">
                  Mercato
                </span>
              </div>
              <nav className="flex flex-col gap-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noopener noreferrer" : undefined}
                    className={`flex items-center gap-2 text-base font-medium transition-colors hover:text-primary ${
                      pathname === link.href ? "text-foreground" : "text-foreground/70"
                    }`}
                  >
                    {t(link.key)}
                    {link.external && <ExternalLink className="h-4 w-4" />}
                  </Link>
                ))}
                <div className="mt-6 flex items-center gap-2 border-t pt-6">
                  <ThemeToggle />
                  <ConnectButton />
                </div>
              </nav>
            </SheetContent>
          </Sheet>

          {/* Logo — basket icon + serif italic wordmark. */}
          <Link
            href="/"
            className="flex items-center gap-2 text-primary transition-opacity hover:opacity-80"
            aria-label={t("logoAria")}
          >
            <MercatoLogo variant="icon" className="h-9 w-9 sm:h-10 sm:w-10" />
            <span className="hidden font-serif text-xl font-semibold italic sm:inline-block">
              Mercato
            </span>
          </Link>
        </div>

        {/* Desktop navigation */}
        <nav className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              target={link.external ? "_blank" : undefined}
              rel={link.external ? "noopener noreferrer" : undefined}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-primary ${
                pathname === link.href
                  ? "text-foreground"
                  : "text-foreground/70"
              }`}
            >
              {t(link.key)}
              {link.external && <ExternalLink className="h-4 w-4" />}
            </Link>
          ))}

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <ConnectButton />
          </div>
        </nav>
      </div>
    </header>
  );
}
