import { celo, celoSepolia } from "wagmi/chains";

import { erc20Abi, priceOracleAbi } from "./abi";

export const SUPPORTED_CHAIN_IDS = [celo.id, celoSepolia.id] as const;
export type SupportedChainId = (typeof SUPPORTED_CHAIN_IDS)[number];

export const ADDRESSES: Record<
  SupportedChainId,
  { priceOracle: `0x${string}` | undefined; cUSD: `0x${string}` | undefined }
> = {
  [celo.id]: {
    priceOracle: (process.env.NEXT_PUBLIC_PRICE_ORACLE_ADDRESS_MAINNET ||
      undefined) as `0x${string}` | undefined,
    cUSD: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
  },
  [celoSepolia.id]: {
    priceOracle: (process.env.NEXT_PUBLIC_PRICE_ORACLE_ADDRESS_SEPOLIA ||
      undefined) as `0x${string}` | undefined,
    cUSD: (process.env.NEXT_PUBLIC_CUSD_ADDRESS_SEPOLIA || undefined) as
      | `0x${string}`
      | undefined,
  },
};

/**
 * Block at which the PriceOracle proxy was deployed per chain. Full-history
 * event scans (server and client) start here so data never rolls out of a
 * block window as the chain advances. Mainnet proxy created in block 67086500
 * (2026-05-17). Single source of truth, imported by both chain-logs.ts
 * (server) and client-logs.ts (client).
 */
export const DEPLOY_BLOCK: Record<number, bigint> = {
  [celo.id]: 67_086_500n,
};

/**
 * @description getPriceOracleAddress — core logic for ${NAME}
 * @returns Result of getPriceOracleAddress computation
 */
export function getPriceOracleAddress(chainId: number): `0x${string}` {
  const cfg = ADDRESSES[chainId as SupportedChainId];
  if (!cfg?.priceOracle) {
    throw new Error(
      `PriceOracle address not configured for chainId=${chainId}`,
    );
  }
  return cfg.priceOracle;
}

/**
 * @description getCUSDAddress — core logic for ${NAME}
 * @returns Result of getCUSDAddress computation
 */
export function getCUSDAddress(chainId: number): `0x${string}` {
  const cfg = ADDRESSES[chainId as SupportedChainId];
  if (!cfg?.cUSD) {
    throw new Error(`cUSD address not configured for chainId=${chainId}`);
  }
  return cfg.cUSD;
}

export { priceOracleAbi, erc20Abi };
// @a11y: focus management on route change
// @perf: monitor allocation pattern here
// @perf: monitor allocation pattern here
// @note: discussed in review thread
// @edge: zero-value special case
// @perf: use index for O(1) lookup
// @cleanup: consolidate with sibling file
// @note: discussed in review thread
