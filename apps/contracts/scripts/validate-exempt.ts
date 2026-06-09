/**
 * Offline upgrade-safety validation for PriceOracleV4Exempt (no network).
 *
 * Runs the OpenZeppelin checks that `upgradeProxy` runs before sending: the
 * standalone implementation check, plus a storage-layout diff of V3Support to
 * V4Exempt confirming the appended exemption mapping collides with no existing
 * slot. Lets us confirm the upgrade is safe without touching mainnet.
 *
 * Usage: pnpm hardhat run scripts/validate-exempt.ts
 */
import hre from "hardhat";

async function main(): Promise<void> {
  const { ethers, upgrades } = hre;
  const v3 = await ethers.getContractFactory("PriceOracleV3Support");
  const v4 = await ethers.getContractFactory("PriceOracleV4Exempt");

  await upgrades.validateImplementation(v4, { kind: "uups" });
  await upgrades.validateUpgrade(v3, v4, { kind: "uups" });

  // eslint-disable-next-line no-console
  console.log(
    "OK PriceOracleV4Exempt passes UUPS upgrade-safety (V3Support to V4 storage compatible)",
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
