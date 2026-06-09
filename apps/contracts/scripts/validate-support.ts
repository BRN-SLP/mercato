/**
 * Offline upgrade-safety validation for PriceOracleV3Support (no network).
 *
 * Runs the OpenZeppelin checks that `upgradeProxy` runs before sending: the
 * standalone implementation check, plus a storage-layout diff of V2Rewards to
 * V3Support confirming the append-only support fields collide with no existing
 * slot. Lets us confirm the upgrade is safe without touching mainnet.
 *
 * Usage: pnpm hardhat run scripts/validate-support.ts
 */
import hre from "hardhat";

async function main(): Promise<void> {
  const { ethers, upgrades } = hre;
  const v2 = await ethers.getContractFactory("PriceOracleV2Rewards");
  const v3 = await ethers.getContractFactory("PriceOracleV3Support");

  await upgrades.validateImplementation(v3, { kind: "uups" });
  await upgrades.validateUpgrade(v2, v3, { kind: "uups" });

  // eslint-disable-next-line no-console
  console.log(
    "OK PriceOracleV3Support passes UUPS upgrade-safety (V2Rewards to V3 storage compatible)",
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
