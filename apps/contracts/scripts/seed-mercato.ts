/**
 * Seed the PriceOracle with the Mercato launch fixture.
 *
 * Submits each entry in `seed/mercato.ts` from the deployer signer,
 * then verifies it with 3 derived signers so the consensus engine
 * finalizes each submission with `accepted=true`. The result is a
 * non-empty /basket dashboard on day one.
 *
 * The on-chain encoding mirrors apps/web/src/lib/encode.ts exactly:
 *   barcode = keccak256(productSlug) truncated to 12 bytes
 *   zoneKey = ISO-3166-1 alpha-2 ASCII bytes, zero-padded to 6 bytes
 *
 * Mirroring (rather than importing) is intentional — hardhat scripts
 * compile under a different tsconfig and pulling the next/server-
 * adjacent `apps/web/src` chain breaks the build. The logic is
 * trivial enough that duplication is the lower-risk option; the
 * shared canonical-product-list is in apps/web/src/lib/products.ts
 * and any slug change there must also land in seed/mercato.ts.
 *
 * Required env vars:
 *   PRIVATE_KEY            Deployer key (also holds the cUSD reserve).
 *   DEPLOYER_MNEMONIC      Mnemonic for deriving verifier wallets.
 *   PRICE_ORACLE_ADDRESS   Proxy address for the target network.
 *
 * Usage:
 *   pnpm hardhat run scripts/seed-mercato.ts --network celo-sepolia
 *   pnpm hardhat run scripts/seed-mercato.ts --network celo
 *
 * Idempotency: if a submission with the same (deployer, barcode,
 * zoneKey) already exists in the event log, the script skips it.
 */

import hre from "hardhat";
import { HDNodeWallet, Mnemonic, keccak256, toUtf8Bytes } from "ethers";

import { MERCATO_SEED } from "../seed/mercato";

const VERIFIER_DERIVATIONS = [
  "m/44'/60'/0'/0/1",
  "m/44'/60'/0'/0/2",
  "m/44'/60'/0'/0/3",
];

const VERIFIER_GAS_FUNDING_WEI = 10n ** 17n; // 0.1 CELO per verifier — covers >= MERCATO_SEED.length verify txs

/** Encode a product slug → bytes12 hex string. Mirrors apps/web/src/lib/encode.ts. */
function productSlugToBarcode(slug: string): `0x${string}` {
  const fullHash = keccak256(toUtf8Bytes(slug));
  return `0x${fullHash.slice(2, 26)}` as `0x${string}`;
}

/** Encode an ISO country code → bytes6 hex string. Mirrors apps/web/src/lib/encode.ts. */
function countryToZoneKey(code: string): `0x${string}` {
  const upper = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(upper)) {
    throw new Error(`countryToZoneKey: expected 2 ASCII letters, got "${code}"`);
  }
  const hex =
    upper.charCodeAt(0).toString(16).padStart(2, "0") +
    upper.charCodeAt(1).toString(16).padStart(2, "0");
  return `0x${hex.padEnd(12, "0")}` as `0x${string}`;
}

/** Convert "2.10" → 210n; "1800" → 180000n. */
function majorUnitsToCents(value: number): bigint {
  const str = value.toString();
  const [whole, frac = ""] = str.split(".");
  const cents = frac.padEnd(2, "0").slice(0, 2);
  return BigInt(whole) * 100n + BigInt(cents);
}

async function main(): Promise<void> {
  const proxyAddress = process.env.PRICE_ORACLE_ADDRESS?.trim();
  if (!proxyAddress) {
    throw new Error("PRICE_ORACLE_ADDRESS env var is required");
  }
  const mnemonic = process.env.DEPLOYER_MNEMONIC?.trim();
  if (!mnemonic) {
    throw new Error("DEPLOYER_MNEMONIC env var is required");
  }

  const { ethers, network } = hre;
  const [deployer] = await ethers.getSigners();
  const deployerAddress = await deployer.getAddress();

  // eslint-disable-next-line no-console
  console.log(
    `[seed-mercato] network=${network.name} proxy=${proxyAddress} deployer=${deployerAddress}`,
  );

  const oracle = await ethers.getContractAt("PriceOracle", proxyAddress, deployer);

  // Discover which entries already exist (idempotent re-runs).
  const existingByKey = new Set<string>();
  try {
    const filter = oracle.filters.PriceSubmitted(undefined, undefined, undefined);
    const events = await oracle.queryFilter(filter, -1_000_000);
    for (const e of events) {
      const args = "args" in e ? e.args : undefined;
      if (!args) continue;
      const submitter = (args as unknown as { submitter?: string }).submitter;
      const barcode = (args as unknown as { barcode?: string }).barcode;
      const zoneKey = (args as unknown as { zoneKey?: string }).zoneKey;
      if (
        submitter?.toLowerCase() === deployerAddress.toLowerCase() &&
        typeof barcode === "string" &&
        typeof zoneKey === "string"
      ) {
        existingByKey.add(`${barcode.toLowerCase()}|${zoneKey.toLowerCase()}`);
      }
    }
  } catch (err) {
    // eslint-disable-next-line no-console
    console.warn("[seed-mercato] could not pre-scan events:", err);
  }

  // Fund verifier wallets so they can broadcast verify txs.
  const provider = deployer.provider;
  if (!provider) throw new Error("deployer.provider is undefined");
  const verifierWallets = VERIFIER_DERIVATIONS.map((path) =>
    HDNodeWallet.fromMnemonic(Mnemonic.fromPhrase(mnemonic), path).connect(provider),
  );

  for (const vw of verifierWallets) {
    const bal = await provider.getBalance(vw.address);
    if (bal < VERIFIER_GAS_FUNDING_WEI / 2n) {
      // eslint-disable-next-line no-console
      console.log(`[seed-mercato] funding verifier ${vw.address}…`);
      const tx = await deployer.sendTransaction({
        to: vw.address,
        value: VERIFIER_GAS_FUNDING_WEI,
      });
      await tx.wait();
    }
  }

  let submitted = 0;
  let skipped = 0;
  for (const row of MERCATO_SEED) {
    const barcode = productSlugToBarcode(row.productSlug);
    const zoneKey = countryToZoneKey(row.countryCode);
    const key = `${barcode.toLowerCase()}|${zoneKey.toLowerCase()}`;
    if (existingByKey.has(key)) {
      skipped++;
      continue;
    }
    const priceCents = majorUnitsToCents(row.priceMajor);
    const zeroHash = `0x${"0".repeat(64)}`;
    const tx = await oracle.submitPrice(barcode, zoneKey, priceCents, zeroHash);
    const receipt = await tx.wait();
    if (!receipt) throw new Error("no receipt for submitPrice");

    // Pull the submissionId out of the PriceSubmitted log.
    let submissionId: bigint | undefined;
    for (const log of receipt.logs ?? []) {
      try {
        const parsed = oracle.interface.parseLog({
          topics: log.topics as string[],
          data: log.data,
        });
        if (parsed?.name === "PriceSubmitted") {
          submissionId = BigInt(parsed.args.submissionId.toString());
          break;
        }
      } catch {
        // not our event; skip
      }
    }
    if (submissionId === undefined) {
      throw new Error("could not parse submissionId from PriceSubmitted log");
    }
    // eslint-disable-next-line no-console
    console.log(
      `[seed-mercato] #${submissionId} ${row.productSlug} ${row.countryCode} ${row.priceMajor} ${row.currency}`,
    );

    // Three verifiers approve.
    for (const vw of verifierWallets) {
      const vOracle = oracle.connect(vw) as typeof oracle;
      const vtx = await vOracle.verify(submissionId, true);
      await vtx.wait();
    }
    submitted++;
  }

  // eslint-disable-next-line no-console
  console.log(
    `[seed-mercato] done. submitted=${submitted} skipped=${skipped} total_in_fixture=${MERCATO_SEED.length}`,
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exitCode = 1;
});
