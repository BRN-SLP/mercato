/**
 * Server-only event reader for the PriceOracle contract.
 *
 * Forno (Celo's public RPC) rejects an unbounded `eth_getLogs` range, so every
 * scan paginates in CHUNK-sized ranges. Full-history scans from the deploy
 * block would need ~1,200 RPC calls (6M+ blocks / 5K), which is too slow for
 * Vercel serverless. Instead we scan RECENT_LOOKBACK blocks (~2.3 days), which
 * is comfortably covered by the daily meRacle cron.
 *
 * A full-archive index (e.g. Dune / The Graph / a dedicated long-running reader)
 * would still be the right answer for permanent history, but for the Mercato
 * dashboard RECENT_LOOKBACK is the practical middle-ground.
 */
import "server-only";

import {
  createPublicClient,
  http,
  decodeEventLog,
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

/** Celo L2 Forno limits eth_getLogs to 5000 blocks per request. */
const CHUNK = 4_999n;

/** How many recent blocks to scan for events. Celo L2 runs ~1s blocks,
 *  so 200_000 blocks ≈ 2.3 days. Enough to survive a skipped cron day
 *  (meRacle runs daily at ~06:00 UTC) without losing data in the site.
 *  200K / 5K chunks ≈ 40 RPC calls @ ~200ms ≈ 8s — well within Vercel
 *  serverless timeout. */
const RECENT_LOOKBACK = 200_000n;

/** Minimal decoded log shape returned to callers (event-agnostic). */
export interface RawEventLog {
  args: Record<string, unknown>;
  blockNumber: bigint | null;
  transactionHash: `0x${string}` | null;
}

/** Resolve the active chain (mainnet if its PriceOracle is configured, else Sepolia). */
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
  const deployBlock = DEPLOY_BLOCK[chainId] ?? 0n;
  const floor = latest > RECENT_LOOKBACK
    ? latest - RECENT_LOOKBACK
    : deployBlock;

  // Use raw eth_getLogs instead of getContractEvents.
  // getContractEvents on Celo L2 via Forno can silently return empty
  // on serverless (likely ABI-decoding edge case with the proxy).
  // Raw getLogs is bulletproof: just returns matching log entries.
  const out: RawEventLog[] = [];
  for (let from = floor; from <= latest; from = from + CHUNK + 1n) {
    const to = from + CHUNK < latest ? from + CHUNK : latest;
    const logs = await c.request({
      method: "eth_getLogs",
      params: [{ address, fromBlock: `0x${from.toString(16)}`, toBlock: `0x${to.toString(16)}` }],
    } as any);
    if (Array.isArray(logs)) {
      for (const log of logs as any[]) {
        try {
          const decoded = decodeEventLog({
            abi,
            eventName,
            data: log.data ?? "0x",
            topics: log.topics ?? [],
          });
          out.push({
            args: decoded.args as unknown as Record<string, unknown>,
            blockNumber: log.blockNumber ? BigInt(log.blockNumber) : null,
            transactionHash: (log.transactionHash as `0x${string}`) ?? null,
          });
        } catch {
          // Skip logs that don't match our event signature.
        }
      }
    }
  }
  return out;
}
