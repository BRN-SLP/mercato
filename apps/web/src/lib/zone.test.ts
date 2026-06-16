import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { gpsToZoneKey, zoneKeyToGps } from "./zone.ts";

describe("gpsToZoneKey and zoneKeyToGps", () => {
  it("produces a 6-byte (0x + 12 hex) key", () => {
    assert.match(gpsToZoneKey(48.85, 2.35), /^0x[0-9a-f]{12}$/);
  });

  it("round-trips coordinates to the 0.01 degree grid", () => {
    const { lat, lng } = zoneKeyToGps(gpsToZoneKey(48.85, 2.35));
    assert.equal(lat, 48.85);
    assert.equal(lng, 2.35);
  });

  it("round-trips negative coordinates via two's complement", () => {
    const { lat, lng } = zoneKeyToGps(gpsToZoneKey(-33.87, -151.21));
    assert.equal(lat, -33.87);
    assert.equal(lng, -151.21);
  });

  it("rejects out-of-range or non-finite coordinates", () => {
    assert.throws(() => gpsToZoneKey(91, 0));
    assert.throws(() => gpsToZoneKey(0, 200));
    assert.throws(() => gpsToZoneKey(Number.NaN, 0));
  });

  it("rejects a key that is not 6 bytes", () => {
    assert.throws(() => zoneKeyToGps("0x1234"));
  });
});
