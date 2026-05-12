import Link from "next/link";
import { Camera, ShieldCheck, Wallet, Zap } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RecentSubmissions } from "@/components/feed/RecentSubmissions";
import { UserBalance } from "@/components/user-balance";

export default function Home() {
  return (
    <main className="flex-1">
      <section className="relative py-16 lg:py-24">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Zap className="h-4 w-4" />
              Crowdsourced product prices on Celo
            </div>

            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Scan a barcode. Share the price. Earn cUSD.
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
              BeiBei is a community price index for everyday products. Submit
              what you paid, verify what others paid, and watch the median
              settle in real time — all on-chain, no middleman.
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/scan">
                  <Camera className="mr-2 h-4 w-4" />
                  Scan a price
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/rewards">
                  <Wallet className="mr-2 h-4 w-4" />
                  My rewards
                </Link>
              </Button>
            </div>

            <div className="mt-12">
              <UserBalance />
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 pb-12">
        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <CardHeader>
              <Camera className="h-6 w-6 text-primary" />
              <CardTitle className="mt-3 text-lg">Scan + submit</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Point your camera at any barcode, enter the price you paid, drop
              an optional receipt photo. Submission goes on-chain in one tx.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <ShieldCheck className="h-6 w-6 text-emerald-500" />
              <CardTitle className="mt-3 text-lg">Verify nearby</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Tap ✓ or ✗ on pending submissions in your zone. Three matching
              votes finalize the price and unlock rewards for everyone
              involved.
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Wallet className="h-6 w-6 text-rose-500" />
              <CardTitle className="mt-3 text-lg">Claim anytime</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Earn micro-rewards in cUSD for accepted submissions and
              verifications. Sweep your balance to MiniPay or any Celo wallet.
            </CardContent>
          </Card>
        </div>
      </section>

      <section className="container mx-auto max-w-5xl px-4 pb-20">
        <h2 className="mb-4 text-xl font-semibold tracking-tight">
          Recent submissions
        </h2>
        <RecentSubmissions />
      </section>
    </main>
  );
}
