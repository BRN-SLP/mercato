/**
 * Deploy MockCUSD (testnet only) and mint 1,000,000 mcUSD to the deployer.
 *
 * Run ONLY on Celo Sepolia. On mainnet we use the real cUSD at
 * 0x765DE816845861e75A25fCA122bb6898B8B1282a.
 *
 * Usage:
 *   pnpm hardhat run scripts/deploy-mock-cusd.ts --network celo-sepolia
 */

import hre from "hardhat";

const MINT_WHOLE_UNITS = 1_000_000n; // 1M tokens to the deployer

async function main() {
  const { ethers, network } = hre;
  const chainId = Number((await ethers.provider.getNetwork()).chainId);
  if (chainId === 42220) {
    throw new Error("Refusing to deploy MockCUSD on Celo Mainnet.");
  }

  const [deployer] = await ethers.getSigners();
  // eslint-disable-next-line no-console
  console.log(
    `\nDeploying MockCUSD on network=${network.name} chainId=${chainId}`,
  );
  // eslint-disable-next-line no-console
  console.log(`  deployer = ${deployer.address}\n`);

  const Factory = await ethers.getContractFactory("MockCUSD");
  const mock = await Factory.deploy();
  await mock.waitForDeployment();
  const address = await mock.getAddress();

  const mintAmount = MINT_WHOLE_UNITS * 10n ** 18n;
  const tx = await mock.mint(deployer.address, mintAmount);
  await tx.wait();

  // eslint-disable-next-line no-console
  console.log(`✓ MockCUSD deployed: ${address}`);
  // eslint-disable-next-line no-console
  console.log(
    `✓ Minted ${MINT_WHOLE_UNITS.toString()} mcUSD to ${deployer.address}`,
  );
  // eslint-disable-next-line no-console
  console.log(
    `\nNext: set CUSD_ADDRESS=${address} in apps/contracts/.env for both repos.\n`,
  );
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
