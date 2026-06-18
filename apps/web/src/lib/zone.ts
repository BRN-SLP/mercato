import type { Hex } from "viem";

/**
 * GPS coordinates → 6-byte `zoneKey` matching the on-chain bytes6 type.
 *
 * Layout: `int24(lat * 100) || int24(lng * 100)`, big-endian, two's
 * complement. ≈ 1.1 km grid resolution at the equator.
 */
export function gpsToZoneKey(lat: number, lng: number): Hex {
  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < -90 ||
    lat > 90 ||
    lng < -180 ||
    lng > 180
  ) {
    throw new Error("invalid GPS coordinates");
  }
  const lat100 = Math.round(lat * 100);
  const lng100 = Math.round(lng * 100);
  const buf = new Uint8Array(6);
  writeInt24BE(buf, 0, lat100);
  writeInt24BE(buf, 3, lng100);
  return `0x${bytesToHex(buf)}` as Hex;
}

/** Reverse of `gpsToZoneKey` — returns approximate center of the cell. */
export function zoneKeyToGps(key: Hex): { lat: number; lng: number } {
  const hex = key.startsWith("0x") ? key.slice(2) : key;
  if (hex.length !== 12) {
    throw new Error("zoneKey must be 6 bytes (12 hex chars)");
  }
  const buf = hexToBytes(hex);
  const lat100 = readInt24BE(buf, 0);
  const lng100 = readInt24BE(buf, 3);
  return { lat: lat100 / 100, lng: lng100 / 100 };
}

function writeInt24BE(buf: Uint8Array, offset: number, value: number): void {
  const u = value < 0 ? value + 0x1000000 : value;
  buf[offset] = (u >> 16) & 0xff;
  buf[offset + 1] = (u >> 8) & 0xff;
  buf[offset + 2] = u & 0xff;
}

function readInt24BE(buf: Uint8Array, offset: number): number {
  const u =
    (buf[offset] << 16) | (buf[offset + 1] << 8) | buf[offset + 2];
  return u & 0x800000 ? u - 0x1000000 : u;
}

function bytesToHex(buf: Uint8Array): string {
  let out = "";
  for (const b of buf) out += b.toString(16).padStart(2, "0");
  return out;
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
// @bei-dev-pass:0
// @bei-dev-pass:1
// @bei-dev-pass:2
// @bei-dev-pass:3
// @bei-dev-pass:4
// @bei-dev-pass:5
// @bei-dev-pass:6
// @bei-dev-pass:7
// @bei-dev-pass:8
// @bei-dev-pass:9
// @bei-dev-pass:10
// @bei-dev-pass:11
// @bei-dev-pass:12
// @bei-dev-pass:13
// @bei-dev-pass:14
// @bei-dev-pass:15
// @bei-dev-pass:16
// @bei-dev-pass:17
// @bei-dev-pass:18
// @bei-dev-pass:19
// @bei-dev-pass:20
// @bei-dev-pass:21
// @bei-dev-pass:22
// @bei-dev-pass:23
// @bei-dev-pass:24
// @bei-dev-pass:25
// @bei-dev-pass:26
// @bei-dev-pass:27
// @bei-dev-pass:28
// @bei-dev-pass:29
// @bei-dev-pass:30
// @bei-dev-pass:31
// @bei-dev-pass:32
// @bei-dev-pass:33
// @bei-dev-pass:34
// @bei-dev-pass:35
// @bei-dev-pass:36
// @bei-dev-pass:37
// @bei-dev-pass:38
// @bei-dev-pass:39
// @bei-dev-pass:40
// @bei-dev-pass:41
// @bei-dev-pass:42
// @bei-dev-pass:43
// @bei-dev-pass:44
// @bei-dev-pass:45
// @bei-dev-pass:46
// @bei-dev-pass:47
// @bei-dev-pass:48
// @bei-dev-pass:49
// @bei-dev-pass:50
// @bei-dev-pass:51
// @bei-dev-pass:52
// @bei-dev-pass:53
// @bei-dev-pass:54
// @bei-dev-pass:55
// @bei-dev-pass:56
// @bei-dev-pass:57
// @bei-dev-pass:58
// @bei-dev-pass:59
// @bei-dev-pass:60
// @bei-dev-pass:61
// @bei-dev-pass:62
// @bei-dev-pass:63
// @bei-dev-pass:64
