/**
 * Encode an EAN-13 / UPC barcode digit string into a 12-byte hex literal.
 * Drops the check digit so EAN-13 (13 digits) and UPC-A (12 digits) both
 * fit in the same 96-bit slot. Throws on invalid input.
 */
export function barcodeStringToHex(input: string): `0x${string}` {
  const digits = input.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 13) {
    throw new Error("barcode must be 8..13 digits");
  }
  const trimmed =
    digits.length >= 12 ? digits.slice(0, digits.length - 1) : digits;
  const padded = trimmed.padStart(24, "0");
  return `0x${padded.padEnd(24, "0").slice(0, 24)}` as `0x${string}`;
}
