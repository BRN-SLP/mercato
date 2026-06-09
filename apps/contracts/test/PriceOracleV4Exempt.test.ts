import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { encodeFunctionData, getAddress, parseUnits } from "viem";

const HUNDRED = parseUnits("100", 18);
const SUBMITTER_REWARD = parseUnits("0.05", 18);
const VERIFIER_REWARD = parseUnits("0.01", 18);
// Exactly the verifier-only payout for one accepted submission (3 x 0.01).
const VERIFIERS_ONLY = VERIFIER_REWARD * 3n;

const BARCODE_A = "0x012345678901234567890123" as `0x${string}`; // 12 bytes
const ZONE_A = "0xabcdef012345" as `0x${string}`; // 6 bytes
const RECEIPT =
  "0x1111111111111111111111111111111111111111111111111111111111111111" as `0x${string}`;

/** Deploy V1 proxy and upgrade V1 -> V2Rewards -> V3Support -> V4Exempt. The
 *  pool is left unfunded; each test mints exactly what it needs. */
async function deployV4() {
  const [owner, alice, bob, carol, dave, meracle] =
    await hre.viem.getWalletClients();
  const publicClient = await hre.viem.getPublicClient();

  const cUSD = await hre.viem.deployContract("MockCUSD", []);
  const v1Impl = await hre.viem.deployContract("PriceOracle", []);
  const initData = encodeFunctionData({
    abi: v1Impl.abi,
    functionName: "initialize",
    args: [owner.account.address, cUSD.address],
  });
  const proxy = await hre.viem.deployContract("ERC1967Proxy", [
    v1Impl.address,
    initData,
  ]);

  const v2 = await hre.viem.deployContract("PriceOracleV2Rewards", []);
  const ownerV1 = await hre.viem.getContractAt("PriceOracle", proxy.address, {
    client: { wallet: owner },
  });
  await ownerV1.write.upgradeToAndCall([v2.address, "0x"]);

  const v3 = await hre.viem.deployContract("PriceOracleV3Support", []);
  const ownerV2 = await hre.viem.getContractAt(
    "PriceOracleV2Rewards",
    proxy.address,
    { client: { wallet: owner } },
  );
  await ownerV2.write.upgradeToAndCall([v3.address, "0x"]);

  const v4Impl = await hre.viem.deployContract("PriceOracleV4Exempt", []);
  const ownerV3 = await hre.viem.getContractAt(
    "PriceOracleV3Support",
    proxy.address,
    { client: { wallet: owner } },
  );
  await ownerV3.write.upgradeToAndCall([v4Impl.address, "0x"]);

  const v4 = await hre.viem.getContractAt("PriceOracleV4Exempt", proxy.address);
  return { owner, alice, bob, carol, dave, meracle, publicClient, cUSD, v4, proxy };
}

type Wallet = Awaited<ReturnType<typeof hre.viem.getWalletClients>>[number];

async function asV4(proxy: `0x${string}`, wallet: Wallet) {
  return hre.viem.getContractAt("PriceOracleV4Exempt", proxy, {
    client: { wallet },
  });
}

/** Submit one observation as `wallet`; returns the minted id. */
async function submitAs(
  proxy: `0x${string}`,
  wallet: Wallet,
  nextId: bigint,
): Promise<bigint> {
  await (await asV4(proxy, wallet)).write.submitPrice([
    BARCODE_A,
    ZONE_A,
    80n,
    RECEIPT,
  ]);
  return nextId;
}

describe("PriceOracleV4Exempt (submitter-reward exemption)", function () {
  it("preserves state and reports version v4", async function () {
    const { owner, v4 } = await loadFixture(deployV4);
    expect(await v4.read.version()).to.equal("v4");
    expect(await v4.read.nextId()).to.equal(0n);
    expect(getAddress(await v4.read.owner())).to.equal(
      getAddress(owner.account.address),
    );
  });

  it("still pays the submitter reward to a non-exempt submitter", async function () {
    const { alice, bob, carol, dave, cUSD, v4, proxy } =
      await loadFixture(deployV4);
    await cUSD.write.mint([proxy.address, HUNDRED]);

    const id = await submitAs(proxy.address, alice, 0n);
    for (const w of [bob, carol, dave]) {
      await (await asV4(proxy.address, w)).write.verify([id, true]);
    }

    expect(await v4.read.pendingRewards([alice.account.address])).to.equal(
      SUBMITTER_REWARD,
    );
    expect(await v4.read.pendingRewards([bob.account.address])).to.equal(
      VERIFIER_REWARD,
    );
  });

  it("pays NO submitter reward to an exempt submitter, verifiers still paid", async function () {
    const { owner, meracle, bob, carol, dave, cUSD, v4, proxy } =
      await loadFixture(deployV4);
    await cUSD.write.mint([proxy.address, HUNDRED]);

    const ownerV4 = await asV4(proxy.address, owner);
    await ownerV4.write.setSubmitterRewardExempt([
      meracle.account.address,
      true,
    ]);
    expect(
      await v4.read.submitterRewardExempt([meracle.account.address]),
    ).to.equal(true);

    const id = await submitAs(proxy.address, meracle, 0n);
    for (const w of [bob, carol, dave]) {
      await (await asV4(proxy.address, w)).write.verify([id, true]);
    }

    // Exempt submitter earns nothing; each verifier still earns the reward.
    expect(await v4.read.pendingRewards([meracle.account.address])).to.equal(0n);
    expect(await v4.read.pendingRewards([bob.account.address])).to.equal(
      VERIFIER_REWARD,
    );
    expect(await v4.read.pendingRewards([carol.account.address])).to.equal(
      VERIFIER_REWARD,
    );
    expect(await v4.read.pendingRewards([dave.account.address])).to.equal(
      VERIFIER_REWARD,
    );
  });

  it("an exempt submission finalizes with only verifier-reward liquidity", async function () {
    const { owner, meracle, bob, carol, dave, cUSD, v4, proxy } =
      await loadFixture(deployV4);
    // Pool holds ONLY the verifier payout (0.03), not the full 0.08.
    await cUSD.write.mint([proxy.address, VERIFIERS_ONLY]);

    await (await asV4(proxy.address, owner)).write.setSubmitterRewardExempt([
      meracle.account.address,
      true,
    ]);

    const id = await submitAs(proxy.address, meracle, 0n);
    for (const w of [bob, carol, dave]) {
      await (await asV4(proxy.address, w)).write.verify([id, true]);
    }

    // Finalized and verifiers paid, even though the pool could never have
    // covered the 0.08 a non-exempt submission would require.
    expect(await v4.read.pendingRewards([bob.account.address])).to.equal(
      VERIFIER_REWARD,
    );
    expect(await v4.read.pendingRewards([meracle.account.address])).to.equal(0n);
  });

  it("a non-exempt submission still needs the full pool (reverts when short)", async function () {
    const { alice, bob, carol, dave, cUSD, proxy } =
      await loadFixture(deployV4);
    // Only 0.03 in the pool: not enough for a non-exempt 0.08 payout.
    await cUSD.write.mint([proxy.address, VERIFIERS_ONLY]);

    const id = await submitAs(proxy.address, alice, 0n);
    await (await asV4(proxy.address, bob)).write.verify([id, true]);
    await (await asV4(proxy.address, carol)).write.verify([id, true]);
    // The third verification triggers finalization, which needs 0.08.
    await expect(
      (await asV4(proxy.address, dave)).write.verify([id, true]),
    ).to.be.rejected;
  });

  it("restricts setSubmitterRewardExempt to the owner", async function () {
    const { alice, meracle, proxy } = await loadFixture(deployV4);
    await expect(
      (await asV4(proxy.address, alice)).write.setSubmitterRewardExempt([
        meracle.account.address,
        true,
      ]),
    ).to.be.rejected;
  });

  it("keeps the V3 support surface working", async function () {
    const { alice, v4, proxy } = await loadFixture(deployV4);
    await (await asV4(proxy.address, alice)).write.support(["nice"]);
    expect(await v4.read.supportCount()).to.equal(1n);
    expect(await v4.read.uniqueSupporters()).to.equal(1n);
  });
});
