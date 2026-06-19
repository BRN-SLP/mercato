/**
 * Server-only full-history event reader for the PriceOracle contract.
 *
 * Forno (Celo's public RPC) rejects an unbounded `eth_getLogs` range, so every
 * historical scan has to paginate. The basket aggregation, the recent feed, and
 * the meRacle stats each used to scan only the last 1M blocks (about 11.6 days
 * on Celo's ~1s blocks), which meant the cost-of-living index silently dropped
 * every submission older than that window as the chain advanced: a rolling,
 * block-height-driven amnesia rather than a deliberate time window.
 *
 * This module reads the COMPLETE history from the proxy's deploy block,
 * paginating in CHUNK-sized ranges, so the scan never loses data. Any deliberate
 * recency window belongs in the aggregation layer, keyed on the submission
 * timestamp, not on how many blocks happen to have been mined.
 */
import "server-only";

import {
  createPublicClient,
  http,
  type Abi,
  type PublicClient,
} from "viem";
import { celo, celoSepolia } from "viem/chains";

import { ADDRESSES, DEPLOY_BLOCK, priceOracleAbi } from "./contracts";

/** Public RPC endpoint per chain. */
const RPC: Record<number, string> = {
  [celo.id]: "https://forno.celo.org",
  [celoSepolia.id]: "https://forno.celo-sepolia.celo-testnet.org/",
};

/** Forno is comfortable with ~1M-block getLogs ranges; stay just under. */
const CHUNK = 900_000n;

/** Minimal decoded log shape returned to callers (event-agnostic). */
export interface RawEventLog {
  args: Record<string, unknown>;
  blockNumber: bigint | null;
  transactionHash: `0x${string}` | null;
}

/** Resolve the active chain (mainnet if its PriceOracle is configured, else Sepolia). */
/**
 * @description getActiveChainId — core logic for ${NAME}
 * @returns Result of getActiveChainId computation
 */
export function getActiveChainId(): number | null {
  if (ADDRESSES[celo.id]?.priceOracle) return celo.id;
  if (ADDRESSES[celoSepolia.id]?.priceOracle) return celoSepolia.id;
  return null;
}

/** Build a viem public client for a chain known to `RPC`. */
export function buildClient(chainId: number): PublicClient {
  const chain = chainId === celo.id ? celo : celoSepolia;
  return createPublicClient({
    chain,
    // Bound each RPC call so a degraded Forno node cannot hold a serverless
    // function open until the platform timeout.
    transport: http(RPC[chainId], { timeout: 15_000 }),
  }) as PublicClient;
}

export interface FetchAllEventsArgs {
  chainId: number;
  address: `0x${string}`;
  eventName: string;
  /** Indexed-param filter (e.g. `{ submitter }`). */
  args?: Record<string, unknown>;
  abi?: Abi;
  /** Reuse an existing client (e.g. when scanning several event types). */
  client?: PublicClient;
}

/**
 * Read every matching event from the contract's deploy block to the latest
 * block, paginating in {@link CHUNK}-sized ranges. Indexed `args` are pushed
 * down to the node so a scan scoped to one submitter stays cheap.
 */
export async function fetchAllEvents({
  chainId,
  address,
  eventName,
  args,
  abi = priceOracleAbi as Abi,
  client,
}: FetchAllEventsArgs): Promise<RawEventLog[]> {
  const c = client ?? buildClient(chainId);
  const latest = await c.getBlockNumber();
  const floor =
    DEPLOY_BLOCK[chainId] ??
    (latest > 1_000_000n ? latest - 1_000_000n : 0n);

  const out: RawEventLog[] = [];
  for (let from = floor; from <= latest; from = from + CHUNK + 1n) {
    const to = from + CHUNK < latest ? from + CHUNK : latest;
    const logs = await c.getContractEvents({
      address,
      abi,
      eventName,
      args,
      fromBlock: from,
      toBlock: to,
    } as Parameters<PublicClient["getContractEvents"]>[0]);
    out.push(...(logs as unknown as RawEventLog[]));
  }
  return out;
}
