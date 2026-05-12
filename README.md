# BeiBei

**Crowdsourced product price tracker on Celo.** Scan a barcode, type the price you paid, drop an optional receipt photo — submission goes on-chain in one transaction. Other users in the same zone verify (✓ / ✗); three matching votes finalize the price and unlock micro-rewards in cUSD for the submitter and verifiers.

- 📷 **Scan** any UPC/EAN-13 barcode from the camera. Falls back to manual entry if the camera is blocked.
- 🗳️ **Verify** nearby pending submissions with a single tap. Consensus is reached at three matching votes.
- 💸 **Earn** 0.001 cUSD per accepted submission and 0.0002 cUSD per verification of an accepted submission. Claim accumulated rewards anytime.
- 📈 **Read** the daily weighted median price for any item over the last 30 days, per zone.

## Architecture

| Layer | Tech |
|---|---|
| Web app | Next.js 14 (App Router), TypeScript, TailwindCSS, Radix UI, [@composer-kit/ui](https://www.composerkit.xyz/) |
| Web3 client | viem 2.x + wagmi 2.x + RainbowKit |
| Smart contract | UUPS-upgradeable Solidity 0.8.28 on Celo, OpenZeppelin contracts-upgradeable 5.6 |
| Barcode scanner | [@zxing/browser](https://github.com/zxing-js/browser) |
| Receipt storage | Vercel Blob (photos), content-addressed by keccak256 |
| Charts | recharts |
| Monorepo | Turborepo |

Submissions are identified by a monotonic `submissionId` from the contract. Locations are bucketed to a 2-decimal lat/lng grid (~1.1km) packed as `bytes6` so a zone is small and indexable. Barcodes are stored as `bytes12` (EAN-13/UPC check digit dropped to fit).

## Project Structure

```
apps/web         Next.js application (landing, scan, item feed, rewards)
apps/contracts   Hardhat smart contract development environment
packages/sdk     @beibei/sdk — public read helpers (npm)
```

## Quick start

```bash
pnpm install
pnpm dev                 # runs Next.js dev server on :3000
```

Copy `.env.example` to the appropriate `.env` files and fill in the values. The web app reads `apps/web/.env.local`; the contracts read `apps/contracts/.env`.

## Smart contract scripts

```bash
pnpm contracts:compile             # compile Solidity
pnpm contracts:test                # 17 Hardhat tests (submit / verify / consensus / claim / UUPS)
pnpm contracts:deploy:celo-sepolia # deploy UUPS proxy to Celo Sepolia
pnpm contracts:deploy:celo         # deploy UUPS proxy to Celo Mainnet
pnpm contracts:seed:celo-sepolia   # transfer 50 cUSD reward pool into the proxy
```

After deploy the script prints both proxy and implementation addresses. Verify the implementation on Celoscan:

```bash
cd apps/contracts
pnpm hardhat verify --network celo-sepolia <implementation-address>
```

## Tests

```bash
pnpm contracts:test                # 17 Hardhat tests, includes UUPS upgrade rehearsal
pnpm --filter web test:e2e         # Playwright smoke tests against dev server
```

## License

MIT — see [LICENSE](./LICENSE).
