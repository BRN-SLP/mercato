/**
 * UUPS upgrade: PriceOracleV2Rewards to PriceOracleV3Support (on-chain support).
 *
 * Adds a free, gas-only public support signal. No initializer call is needed
 * (the support counters start at zero) and no storage is rewritten, so every
 * submission, reward, and verifier record survives.
 *
 * The mainnet proxy was deployed fresh with V2Rewards as its initial impl, so it
 * may not be in the local .openzeppelin manifest. We `forceImport` the current
 * V2Rewards impl first (idempotent) so `upgradeProxy` can validate the layout.
 *
 * RUN THIS YOURSELF with the proxy OWNER key. Always rehearse on
 * `--network celo-sepolia` before mainnet.
 *
 * Required env vars:
 *   PRIVATE_KEY            Current proxy owner.
 *   PRICE_ORACLE_ADDRESS   Proxy address for the target network.
 *
 * Usage:
 *   PRICE_ORACLE_ADDRESS=0x... pnpm hardhat run scripts/upgrade-support.ts --network celo-sepolia
 *   PRICE_ORACLE_ADDRESS=0x... pnpm hardhat run scripts/upgrade-support.ts --network celo
 */
import hre from "hardhat";

async function main(): Promise<void> {
  const proxyAddress = process.env.PRICE_ORACLE_ADDRESS?.trim();
  if (!proxyAddress) {
    throw new Error("PRICE_ORACLE_ADDRESS env var is required");
  }

  const { ethers, upgrades, network } = hre;
  const [signer] = await ethers.getSigners();

  const V2 = await ethers.getContractFactory("PriceOracleV2Rewards");
  const V3 = await ethers.getContractFactory("PriceOracleV3Support");

  const beforeNextId: bigint = await ethers
    .getContractAt("PriceOracleV2Rewards", proxyAddress, signer)
    .then((c) => c.nextId());

  // Register the proxy in the manifest if it is not already there.
  try {
    await upgrades.forceImport(proxyAddress, V2, { kind: "uups" });
  } catch {
    // Already imported, or import not needed; upgradeProxy still validates.
  }

  // eslint-disable-next-line no-console
  console.log(
    `\nUpgrading PriceOracle proxy to V3Support on network=${network.name}\n` +
      `  proxy    = ${proxyAddress}\n` +
      `  deployer = ${signer.address}\n` +
      `  nextId   = ${beforeNextId}\n`,
  );

  const upgraded = await upgrades.upgradeProxy(proxyAddress, V3, {
    kind: "uups",
  });
  await upgraded.waitForDeployment();
  const impl = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  const v3 = await ethers.getContractAt(
    "PriceOracleV3Support",
    proxyAddress,
    signer,
  );
  const afterNextId: bigint = await v3.nextId();
  const tag: string = await v3.version();

  if (afterNextId !== beforeNextId) {
    throw new Error(
      `nextId mutated during upgrade (before=${beforeNextId}, after=${afterNextId}); storage drift?`,
    );
  }

  // eslint-disable-next-line no-console
  console.log(
    `OK V3 impl       = ${impl}\n` +
      `OK version()     = ${tag}\n` +
      `OK nextId kept   = ${afterNextId}\n` +
      `   verify: pnpm hardhat verify --network ${network.name} ${impl}\n`,
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
