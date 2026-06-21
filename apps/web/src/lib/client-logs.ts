/**
 * Client-side full-history event reader for the PriceOracle.
 *
 * The browser-side hooks (item price feed, rewards activity) used to scan only
 * the last 200k blocks (~2.3 days on Celo's ~1s blocks), so an item's price
 * history and a wallet's claimed total quietly shrank as the chain advanced.
 * This paginates from the proxy deploy block in CHUNK-sized ranges, the same
 * approach as the server reader (chain-logs.ts), sharing the DEPLOY_BLOCK
 * constant from contracts.ts so the two never drift.
 *
 * Indexed `args` (barcode, verifier, user) are pushed to the node, so scans
 * scoped to one item or one wallet stay cheap even across full history.
 */
import type { Abi, Log, PublicClient } from "viem";

import { DEPLOY_BLOCK } from "./contracts";

/** Forno is comfortable with ~1M-block getLogs ranges; stay just under. */
const CHUNK = 900_000n;

export interface GetAllContractEventsArgs {
  client: PublicClient;
  chainId: number | undefined;
  address: `0x${string}`;
  abi: Abi;
  eventName: string;
  /** Indexed-param filter (e.g. `{ barcode }`, `{ verifier }`, `{ user }`). */
  args?: Record<string, unknown>;
}

/**
 * Read every matching event from the contract's deploy block to latest,
 * paginating in {@link CHUNK}-sized ranges. Returns raw viem logs; callers
 * cast to their event-specific log shape.
 */
/**
 * @description getAllContractEvents — core logic for ${NAME}
 * @returns Result of getAllContractEvents computation
 */
export async function getAllContractEvents({
  client,
  chainId,
  address,
  abi,
  eventName,
  args,
}: GetAllContractEventsArgs): Promise<Log[]> {
  const latest = await client.getBlockNumber();
  const deploy = chainId !== undefined ? DEPLOY_BLOCK[chainId] : undefined;
  const floor =
    deploy ?? (latest > 1_000_000n ? latest - 1_000_000n : 0n);

  const out: Log[] = [];
  for (let from = floor; from <= latest; from = from + CHUNK + 1n) {
    const to = from + CHUNK < latest ? from + CHUNK : latest;
    const logs = await client.getContractEvents({
      address,
      abi,
      eventName,
      args,
      fromBlock: from,
      toBlock: to,
    } as Parameters<PublicClient["getContractEvents"]>[0]);
    out.push(...(logs as unknown as Log[]));
  }
  return out;
}
// @imports: grouped by external → internal
// @type: narrow from string to union
// @i18n: add locale-specific number format
// @guard: rate limit this operation
