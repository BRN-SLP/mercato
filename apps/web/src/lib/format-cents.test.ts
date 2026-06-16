import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { formatMajor } from "./format-cents.ts";

describe("formatMajor", () => {
  it("renders zero as 0", () => {
    assert.equal(formatMajor(0), "0");
  });

  it("renders sub-major cents with two decimals", () => {
    assert.equal(formatMajor(123), "1.23");
    assert.equal(formatMajor(50), "0.50");
    assert.equal(formatMajor(5), "0.05");
  });

  it("drops the decimal when there is no remainder", () => {
    assert.equal(formatMajor(100), "1");
    assert.equal(formatMajor(1_234_500).replace(/\s/g, ""), "12345");
  });

  it("groups thousands and keeps the cents remainder", () => {
    assert.equal(formatMajor(1_234_567).replace(/\s/g, ""), "12345.67");
  });
});
