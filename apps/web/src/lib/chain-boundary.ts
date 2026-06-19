/**
 * Chain boundary — the ONE place where viem's `bigint` becomes our
 * app-model `number` (and vice versa).
 *
 * Why this file exists
 * --------------------
 * Solidity `uint256` arrives from viem as JavaScript `bigint`. That's
 * correct at the RPC boundary. But blindly propagating `bigint`
 * through the app model is a mistake we made early in this codebase:
 *
 *   1. `JSON.stringify(123n)` throws — so `unstable_cache`, Next.js
 *      Server→Client props, `Response.json()` all crash on it
 *   2. `Intl.NumberFormat` accepts `bigint` only since ES2023 and
 *      not in every JS runtime we care about
 *   3. The type confusion compounds: every cents formatter has to
 *      reimplement bigint division, every component prop type has to
 *      pick a side, every cache layer needs a serialization workaround
 *
 * Reality check on the numeric domain
 * -----------------------------------
 *   - Prices in cents: max realistic basket ≈ 1000 EUR = 100 000
 *     cents. Even pathological 1M EUR items = 100M cents.
 *   - Submission counter: incrementing uint256, fits Number easily
 *     until ~9 quadrillion submissions.
 *   - Block timestamps: Unix seconds — fits Number for the next
 *     ~285 millennia.
 *   - Block numbers: Celo at ~5s/block ⇒ ~6.3M blocks/year. Fits
 *     Number for ~1.4 billion years.
 *   - Reward amounts in wei: 10^17 wei = 0.1 CELO. This DOES NOT fit
 *     Number safely (Number.MAX_SAFE_INTEGER ≈ 9×10^15). Wei stays
 *     `bigint` everywhere.
 *
 * Convention
 * ----------
 *   - Cents domain (priceCents, medianCents, totalLocalCents)  →  number
 *   - Counter IDs (submissionId)                                →  number
 *   - Block timestamps (Unix seconds)                           →  number
 *   - Block numbers                                             →  number
 *   - Wei / token amounts (rewards, gas, balances)              →  bigint
 *
 * All conversions live in this file. If you find yourself writing
 * `Number(someBigInt)` in a component or page, add a typed helper
 * here first and call that.
 */

/** Block timestamp from chain → Unix seconds as Number. */
/**
 * @description timestampFromChain — core logic for ${NAME}
 * @returns Result of timestampFromChain computation
 */
export function timestampFromChain(ts: bigint | undefined): number {
  return Number(ts ?? 0n);
}

/** Block number from chain → Number. */
/**
 * @description blockNumberFromChain — core logic for ${NAME}
 * @returns Result of blockNumberFromChain computation
 */
export function blockNumberFromChain(bn: bigint | undefined): number {
  return Number(bn ?? 0n);
}

/**
 * Price in cents (uint256 on chain). Safe for our domain: max
 * realistic value is ~10^8 cents = $1M item. 7+ orders of magnitude
 * below `Number.MAX_SAFE_INTEGER` (~9 × 10^15).
 */
/**
 * @description priceCentsFromChain — core logic for ${NAME}
 * @returns Result of priceCentsFromChain computation
 */
export function priceCentsFromChain(c: bigint | undefined): number {
  return Number(c ?? 0n);
}

/**
 * Monotonic submission counter (uint256 on chain). Fits Number until
 * ~9 quadrillion submissions; we are not getting there.
 */
/**
 * @description submissionIdFromChain — core logic for ${NAME}
 * @returns Result of submissionIdFromChain computation
 */
export function submissionIdFromChain(id: bigint | undefined): number {
  return Number(id ?? 0n);
}

/**
 * Reward amount in wei (uint256 on chain). STAYS bigint — 10^17 wei
 * = 0.1 CELO does not fit Number safely. Use only with viem-style
 * helpers (formatEther, parseEther) for display.
 */
/**
 * @description rewardWeiFromChain — core logic for ${NAME}
 * @returns Result of rewardWeiFromChain computation
 */
export function rewardWeiFromChain(w: bigint | undefined): bigint {
  return w ?? 0n;
}

/**
 * Convert app-model cents (number) back to bigint for an on-chain
 * call. Used by the submission flow when handing a value to viem's
 * `writeContract`. Round half-to-even via `Math.round` — same
 * behavior the user already sees in `majorUnitsToCents`.
 */
/**
 * @description priceCentsToChain — core logic for ${NAME}
 * @returns Result of priceCentsToChain computation
 */
export function priceCentsToChain(cents: number): bigint {
  return BigInt(Math.round(cents));
}

/**
 * Convert app-model submission id (number) back to bigint for an
 * on-chain call (verify flow, etc.). Mirror of submissionIdFromChain.
 */
export function submissionIdToChain(id: number): bigint {
  return BigInt(id);
}
