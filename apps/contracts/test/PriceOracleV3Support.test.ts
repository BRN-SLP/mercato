import { loadFixture } from "@nomicfoundation/hardhat-toolbox-viem/network-helpers";
import { expect } from "chai";
import hre from "hardhat";
import { encodeFunctionData, getAddress, parseUnits } from "viem";

const HUNDRED = parseUnits("100", 18);
const BARCODE_A = "0x012345678901234567890123" as `0x${string}`; // 12 bytes
const ZONE_A = "0xabcdef012345" as `0x${string}`; // 6 bytes
const RECEIPT =
  "0x1111111111111111111111111111111111111111111111111111111111111111" as `0x${string}`;

/** Deploy V1 proxy, seed the pool, do one submission (so nextId advances), then
 *  upgrade V1 -> V2Rewards -> V3Support. The V3 upgrade carries no initializer
 *  (the support counters start at zero). */
async function deployV3() {
  const [owner, alice, bob, carol] = await hre.viem.getWalletClients();
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
  await cUSD.write.mint([proxy.address, HUNDRED]);

  // V1: one submission so nextId = 1 (state to preserve across upgrades).
  const v1Alice = await hre.viem.getContractAt("PriceOracle", proxy.address, {
    client: { wallet: alice },
  });
  await v1Alice.write.submitPrice([BARCODE_A, ZONE_A, 80n, RECEIPT]);

  // V1 -> V2Rewards.
  const v2Impl = await hre.viem.deployContract("PriceOracleV2Rewards", []);
  const ownerV1 = await hre.viem.getContractAt("PriceOracle", proxy.address, {
    client: { wallet: owner },
  });
  await ownerV1.write.upgradeToAndCall([v2Impl.address, "0x"]);

  // V2Rewards -> V3Support.
  const v3Impl = await hre.viem.deployContract("PriceOracleV3Support", []);
  const ownerV2 = await hre.viem.getContractAt(
    "PriceOracleV2Rewards",
    proxy.address,
    { client: { wallet: owner } },
  );
  await ownerV2.write.upgradeToAndCall([v3Impl.address, "0x"]);

  const v3 = await hre.viem.getContractAt("PriceOracleV3Support", proxy.address);
  return { owner, alice, bob, carol, publicClient, cUSD, v3, proxy };
}

async function supportAs(
  proxyAddr: `0x${string}`,
  wallet: Awaited<ReturnType<typeof hre.viem.getWalletClients>>[number],
  message: string,
) {
  const as = await hre.viem.getContractAt("PriceOracleV3Support", proxyAddr, {
    client: { wallet },
  });
  return as.write.support([message]);
}

describe("PriceOracleV3Support (on-chain support)", function () {
  it("preserves prior state through the V3 upgrade", async function () {
    const { owner, v3 } = await loadFixture(deployV3);

    expect(await v3.read.nextId()).to.equal(1n);
    expect(await v3.read.version()).to.equal("v3");
    expect(getAddress(await v3.read.owner())).to.equal(
      getAddress(owner.account.address),
    );
    expect(await v3.read.supportCount()).to.equal(0n);
    expect(await v3.read.uniqueSupporters()).to.equal(0n);
  });

  it("still accepts submissions after the V3 upgrade", async function () {
    const { bob, v3, proxy } = await loadFixture(deployV3);
    const bobV3 = await hre.viem.getContractAt(
      "PriceOracleV3Support",
      proxy.address,
      { client: { wallet: bob } },
    );
    await bobV3.write.submitPrice([BARCODE_A, ZONE_A, 81n, RECEIPT]);
    expect(await v3.read.nextId()).to.equal(2n);
  });

  it("records support with a message and counts the wallet once", async function () {
    const { alice, v3, proxy } = await loadFixture(deployV3);
    await supportAs(proxy.address, alice, "great work");

    expect(await v3.read.supportCount()).to.equal(1n);
    expect(await v3.read.uniqueSupporters()).to.equal(1n);
    expect(await v3.read.hasSupported([alice.account.address])).to.equal(true);

    const events = await v3.getEvents.Supported();
    const last = events[events.length - 1];
    expect(getAddress(last.args.supporter as `0x${string}`)).to.equal(
      getAddress(alice.account.address),
    );
    expect(last.args.message).to.equal("great work");
    expect((last.args.at as bigint) > 0n).to.equal(true);
  });

  it("counts repeat support from the same wallet once in uniqueSupporters", async function () {
    const { alice, v3, proxy } = await loadFixture(deployV3);
    await supportAs(proxy.address, alice, "");
    await supportAs(proxy.address, alice, "again");

    expect(await v3.read.supportCount()).to.equal(2n);
    expect(await v3.read.uniqueSupporters()).to.equal(1n);
  });

  it("tracks distinct supporters", async function () {
    const { alice, bob, carol, v3, proxy } = await loadFixture(deployV3);
    await supportAs(proxy.address, alice, "");
    await supportAs(proxy.address, bob, "");
    await supportAs(proxy.address, carol, "");

    expect(await v3.read.supportCount()).to.equal(3n);
    expect(await v3.read.uniqueSupporters()).to.equal(3n);
  });

  it("allows an empty message and rejects an over-long one", async function () {
    const { alice, bob, proxy } = await loadFixture(deployV3);
    await supportAs(proxy.address, alice, "");
    await expect(supportAs(proxy.address, bob, "a".repeat(281))).to.be.rejected;
  });
});
