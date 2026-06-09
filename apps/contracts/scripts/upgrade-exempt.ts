/**
 * UUPS upgrade: PriceOracleV3Support to PriceOracleV4Exempt, then exempt the
 * oracle agent from the submitter reward so its bootstrap submissions stop
 * self-rewarding out of the pool. Verifier rewards are unchanged.
 *
 * forceImports the current V3Support impl first (mainnet may be absent from the
 * local manifest), runs upgradeProxy, then calls setSubmitterRewardExempt.
 *
 * RUN THIS YOURSELF with the proxy OWNER key. Rehearse on celo-sepolia first.
 *
 * Required env:
 *   PRIVATE_KEY            current proxy owner
 *   PRICE_ORACLE_ADDRESS   proxy address for the target network
 * Optional env:
 *   MERACLE_ADDRESS        submitter to exempt (default below). Set "" to skip.
 *
 * Usage:
 *   PRICE_ORACLE_ADDRESS=0x... pnpm hardhat run scripts/upgrade-exempt.ts --network celo-sepolia
 *   PRICE_ORACLE_ADDRESS=0x... pnpm hardhat run scripts/upgrade-exempt.ts --network celo
 */
import hre from "hardhat";

// meRacle operational hot wallet (the autonomous oracle agent). Override via
// MERACLE_ADDRESS, or pass "" to upgrade without exempting anyone.
const DEFAULT_MERACLE = "0x1B94d56f723d8939661D94eD1f899C5c27136b2c";

async function main(): Promise<void> {
  const proxyAddress = process.env.PRICE_ORACLE_ADDRESS?.trim();
  if (!proxyAddress) {
    throw new Error("PRICE_ORACLE_ADDRESS env var is required");
  }
  const meracle =
    process.env.MERACLE_ADDRESS === undefined
      ? DEFAULT_MERACLE
      : process.env.MERACLE_ADDRESS.trim();

  const { ethers, upgrades, network } = hre;
  const [signer] = await ethers.getSigners();

  const V3 = await ethers.getContractFactory("PriceOracleV3Support");
  const V4 = await ethers.getContractFactory("PriceOracleV4Exempt");

  // Register the proxy in the manifest if it is not already there.
  try {
    await upgrades.forceImport(proxyAddress, V3, { kind: "uups" });
  } catch {
    // Already imported, or import not needed; upgradeProxy still validates.
  }

  // eslint-disable-next-line no-console
  console.log(
    `\nUpgrading PriceOracle to V4Exempt on network=${network.name}\n` +
      `  proxy    = ${proxyAddress}\n` +
      `  deployer = ${signer.address}\n` +
      `  exempt   = ${meracle || "(none)"}\n`,
  );

  const upgraded = await upgrades.upgradeProxy(proxyAddress, V4, {
    kind: "uups",
  });
  await upgraded.waitForDeployment();
  const impl = await upgrades.erc1967.getImplementationAddress(proxyAddress);

  const v4 = await ethers.getContractAt(
    "PriceOracleV4Exempt",
    proxyAddress,
    signer,
  );

  if (meracle) {
    const tx = await v4.setSubmitterRewardExempt(meracle, true);
    await tx.wait();
  }

  const tag: string = await retry(() => v4.version());
  const isExempt: boolean = meracle
    ? await retry(() => v4.submitterRewardExempt(meracle))
    : false;

  // eslint-disable-next-line no-console
  console.log(
    `OK V4 impl     = ${impl}\n` +
      `OK version()   = ${tag}\n` +
      (meracle ? `OK exempt set  = ${isExempt} (${meracle})\n` : "") +
      `   verify: pnpm hardhat verify --network ${network.name} ${impl}\n`,
  );
}

async function retry<T>(fn: () => Promise<T>, tries = 4, delayMs = 1500): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i < tries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw lastErr;
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
