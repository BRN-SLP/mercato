import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatCurrency, isValidAddress, truncateAddress } from "./app-utils.ts";

describe("formatCurrency", () => {
  it("formats USD by default", () => {
    const out = formatCurrency(1234.5);
    assert.ok(out.includes("$"));
    assert.ok(out.includes("1,234.50"));
  });

  it("honors an explicit currency code", () => {
    assert.ok(formatCurrency(10, "EUR").includes("10"));
  });
});

describe("truncateAddress", () => {
  it("shortens a full address to head and tail", () => {
    assert.equal(
      truncateAddress("0x1234567890abcdef1234567890abcdef12345678"),
      "0x1234...5678",
    );
  });

  it("leaves short strings untouched", () => {
    assert.equal(truncateAddress("0x1234"), "0x1234");
  });
});

describe("isValidAddress", () => {
  it("accepts a 40 hex char 0x address", () => {
    assert.equal(isValidAddress(`0x${"a".repeat(40)}`), true);
  });

  it("rejects malformed addresses", () => {
    assert.equal(isValidAddress("0x123"), false);
    assert.equal(isValidAddress("nope"), false);
  });
});
