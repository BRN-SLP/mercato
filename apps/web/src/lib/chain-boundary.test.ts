import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  blockNumberFromChain,
  priceCentsFromChain,
  priceCentsToChain,
  rewardWeiFromChain,
  submissionIdFromChain,
  submissionIdToChain,
  timestampFromChain,
} from "./chain-boundary.ts";

describe("chain-boundary number conversions", () => {
  it("converts defined bigints to number", () => {
    assert.equal(timestampFromChain(1_700_000_000n), 1_700_000_000);
    assert.equal(blockNumberFromChain(42n), 42);
    assert.equal(priceCentsFromChain(12_345n), 12_345);
    assert.equal(submissionIdFromChain(7n), 7);
  });

  it("treats undefined as zero", () => {
    assert.equal(timestampFromChain(undefined), 0);
    assert.equal(blockNumberFromChain(undefined), 0);
    assert.equal(priceCentsFromChain(undefined), 0);
    assert.equal(submissionIdFromChain(undefined), 0);
  });
});

describe("chain-boundary bigint side", () => {
  it("keeps reward wei as bigint and defaults to 0n", () => {
    assert.equal(rewardWeiFromChain(100_000_000_000_000_000n), 100_000_000_000_000_000n);
    assert.equal(rewardWeiFromChain(undefined), 0n);
  });

  it("rounds cents to bigint for on-chain calls", () => {
    assert.equal(priceCentsToChain(12_345), 12_345n);
    assert.equal(priceCentsToChain(12.4), 12n);
    assert.equal(priceCentsToChain(12.5), 13n);
  });

  it("converts a submission id back to bigint", () => {
    assert.equal(submissionIdToChain(7), 7n);
  });
});
