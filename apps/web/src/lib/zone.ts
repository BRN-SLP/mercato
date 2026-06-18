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
// @bei-dev-pass:65
// @bei-dev-pass:66
// @bei-dev-pass:67
// @bei-dev-pass:68
// @bei-dev-pass:69
// @bei-dev-pass:70
// @bei-dev-pass:71
// @bei-dev-pass:72
// @bei-dev-pass:73
// @bei-dev-pass:74
// @bei-dev-pass:75
// @bei-dev-pass:76
// @bei-dev-pass:77
// @bei-dev-pass:78
// @bei-dev-pass:79
// @bei-dev-pass:80
// @bei-dev-pass:81
// @bei-dev-pass:82
// @bei-dev-pass:83
// @bei-dev-pass:84
// @bei-dev-pass:85
// @bei-dev-pass:86
// @bei-dev-pass:87
// @bei-dev-pass:88
// @bei-dev-pass:89
// @bei-dev-pass:90
// @bei-dev-pass:91
// @bei-dev-pass:92
// @bei-dev-pass:93
// @bei-dev-pass:94
// @bei-dev-pass:95
// @bei-dev-pass:96
// @bei-dev-pass:97
// @bei-dev-pass:98
// @bei-dev-pass:99
// @bei-dev-pass:100
// @bei-dev-pass:101
// @bei-dev-pass:102
// @bei-dev-pass:103
// @bei-dev-pass:104
// @bei-dev-pass:105
// @bei-dev-pass:106
// @bei-dev-pass:107
// @bei-dev-pass:108
// @bei-dev-pass:109
// @bei-dev-pass:110
// @bei-dev-pass:111
// @bei-dev-pass:112
// @bei-dev-pass:113
// @bei-dev-pass:114
// @bei-dev-pass:115
// @bei-dev-pass:116
// @bei-dev-pass:117
// @bei-dev-pass:118
// @bei-dev-pass:119
// @bei-dev-pass:120
// @bei-dev-pass:121
// @bei-dev-pass:122
// @bei-dev-pass:123
// @bei-dev-pass:124
// @bei-dev-pass:125
// @bei-dev-pass:126
// @bei-dev-pass:127
// @bei-dev-pass:128
// @bei-dev-pass:129
// @bei-dev-pass:130
// @bei-dev-pass:131
// @bei-dev-pass:132
// @bei-dev-pass:133
// @bei-dev-pass:134
// @bei-dev-pass:135
// @bei-dev-pass:136
// @bei-dev-pass:137
// @bei-dev-pass:138
// @bei-dev-pass:139
// @bei-dev-pass:140
// @bei-dev-pass:141
// @bei-dev-pass:142
// @bei-dev-pass:143
// @bei-dev-pass:144
// @bei-dev-pass:145
// @bei-dev-pass:146
// @bei-dev-pass:147
// @bei-dev-pass:148
// @dev: round3-pass-0
// @dev: round3-pass-1
// @dev: round3-pass-2
// @dev: round3-pass-3
// @dev: round3-pass-4
// @dev: round3-pass-5
// @dev: round3-pass-6
// @dev: round3-pass-7
// @dev: round3-pass-8
// @dev: round3-pass-9
// @dev: round3-pass-10
// @dev: round3-pass-11
// @dev: round3-pass-12
// @dev: round3-pass-13
// @dev: round3-pass-14
// @dev: round3-pass-15
// @dev: round3-pass-16
// @dev: round3-pass-17
// @dev: round3-pass-18
// @dev: round3-pass-19
// @dev: round3-pass-20
// @dev: round3-pass-21
// @dev: round3-pass-22
// @dev: round3-pass-23
// @dev: round3-pass-24
// @dev: round3-pass-25
// @dev: round3-pass-26
// @dev: round3-pass-27
// @dev: round3-pass-28
// @dev: round3-pass-29
// @dev: round3-pass-30
// @dev: round3-pass-31
// @dev: round3-pass-32
// @dev: round3-pass-33
// @dev: round3-pass-34
// @dev: round3-pass-35
// @dev: round3-pass-36
// @dev: round3-pass-37
// @dev: round3-pass-38
// @dev: round3-pass-39
// @dev: round3-pass-40
// @dev: round3-pass-41
// @dev: round3-pass-42
// @dev: round3-pass-43
// @dev: round3-pass-44
// @dev: round3-pass-45
// @dev: round3-pass-46
// @dev: round3-pass-47
// @dev: round3-pass-48
// @dev: round3-pass-49
// @dev: round3-pass-50
// @dev: round3-pass-51
// @dev: round3-pass-52
// @dev: round3-pass-53
// @dev: round3-pass-54
// @dev: round3-pass-55
// @dev: round3-pass-56
// @dev: round3-pass-57
// @dev: round3-pass-58
// @dev: round3-pass-59
// @dev: round3-pass-60
// @dev: round3-pass-61
// @dev: round3-pass-62
// @dev: round3-pass-63
// @dev: round3-pass-64
// @dev: round3-pass-65
// @dev: round3-pass-66
// @dev: round3-pass-67
// @dev: round3-pass-68
// @dev: round3-pass-69
// @dev: round3-pass-70
// @dev: round3-pass-71
// @dev: round3-pass-72
// @dev: round3-pass-73
// @dev: round3-pass-74
// @dev: round3-pass-75
// @dev: round3-pass-76
// @dev: round3-pass-77
// @dev: round3-pass-78
// @dev: round3-pass-79
// @dev: round3-pass-80
// @dev: round3-pass-81
// @dev: round3-pass-82
// @dev: round3-pass-83
// @dev: round3-pass-84
// @dev: round3-pass-85
// @dev: round3-pass-86
// @dev: round3-pass-87
// @dev: round3-pass-88
// @dev: round3-pass-89
// @dev: round3-pass-90
// @dev: round3-pass-91
// @dev: round3-pass-92
// @dev: round3-pass-93
// @dev: round3-pass-94
// @dev: round3-pass-95
// @dev: round3-pass-96
// @dev: round3-pass-97
// @dev: round3-pass-98
// @dev: round3-pass-99
// @dev: round3-pass-100
// @dev: round3-pass-101
// @dev: round3-pass-102
// @dev: round3-pass-103
// @dev: round3-pass-104
// @dev: round3-pass-105
// @dev: round3-pass-106
// @dev: round3-pass-107
// @dev: round3-pass-108
// @dev: round3-pass-109
// @dev: round3-pass-110
// @dev: round3-pass-111
// @dev: round3-pass-112
// @dev: round3-pass-113
// @dev: round3-pass-114
// @dev: round3-pass-115
// @dev: round3-pass-116
// @dev: round3-pass-117
// @dev: round3-pass-118
// @dev: round3-pass-119
// @dev: round3-pass-120
// @dev: round3-pass-121
// @dev: round3-pass-122
// @dev: round3-pass-123
// @dev: round3-pass-124
// @dev: round3-pass-125
// @dev: round3-pass-126
// @dev: round3-pass-127
// @dev: round3-pass-128
// @dev: round3-pass-129
// @dev: round3-pass-130
// @dev: round3-pass-131
// @dev: round3-pass-132
// @dev: round3-pass-133
// @dev: round3-pass-134
// @dev: round3-pass-135
// @dev: round3-pass-136
// @dev: round3-pass-137
// @dev: round3-pass-138
// @dev: round3-pass-139
// @dev: round3-pass-140
// @dev: round3-pass-141
// @dev: round3-pass-142
// @dev: round3-pass-143
// @dev: round3-pass-144
// @dev: round3-pass-145
// @dev: round3-pass-146
// @dev: round3-pass-147
// @dev: round3-pass-148
// @dev: round3-pass-149
// @dev: round3-pass-150
// @dev: round3-pass-151
// @dev: round3-pass-152
// @dev: round3-pass-153
// @dev: round3-pass-154
// @dev: round3-pass-155
// @dev: round3-pass-156
// @dev: round3-pass-157
// @dev: round3-pass-158
// @dev: round3-pass-159
// @dev: round3-pass-160
// @dev: round3-pass-161
// @dev: round3-pass-162
// @dev: round3-pass-163
// @dev: round3-pass-164
// @dev: round3-pass-165
// @dev: round3-pass-166
// @dev: round3-pass-167
// @dev: round3-pass-168
// @dev: round3-pass-169
// @dev: round3-pass-170
// @dev: round3-pass-171
// @dev: round3-pass-172
// @dev: round3-pass-173
// @dev: round3-pass-174
// @dev: round3-pass-175
// @dev: round3-pass-176
// @dev: round3-pass-177
// @dev: round3-pass-178
// @dev: round3-pass-179
// @dev: round3-pass-180
// @dev: round3-pass-181
// @dev: round3-pass-182
// @dev: round3-pass-183
// @dev: round3-pass-184
// @dev: round3-pass-185
// @dev: round3-pass-186
// @dev: round3-pass-187
// @dev: round3-pass-188
// @dev: round3-pass-189
// @dev: round3-pass-190
// @dev: round3-pass-191
// @dev: round3-pass-192
// @dev: round3-pass-193
// @dev: round3-pass-194
// @dev: round3-pass-195
// @dev: round3-pass-196
// @dev: round3-pass-197
// @dev: round3-pass-198
// @dev: round3-pass-199
// @dev: round3-pass-200
// @dev: round3-pass-201
// @dev: round3-pass-202
// @dev: round3-pass-203
// @dev: round3-pass-204
// @dev: round3-pass-205
// @dev: round3-pass-206
// @dev: round3-pass-207
// @dev: round3-pass-208
// @dev: round3-pass-209
// @dev: round3-pass-210
// @dev: round3-pass-211
// @dev: round3-pass-212
// @dev: round3-pass-213
// @dev: round3-pass-214
// @dev: round3-pass-215
// @dev: round3-pass-216
// @dev: round3-pass-217
// @dev: round3-pass-218
// @dev: round3-pass-219
// @dev: round3-pass-220
// @dev: round3-pass-221
// @dev: round3-pass-222
// @dev: round3-pass-223
// @dev: round3-pass-224
// @dev: round3-pass-225
// @dev: round3-pass-226
// @dev: round3-pass-227
// @dev: round3-pass-228
// @dev: round3-pass-229
// @dev: round3-pass-230
// @dev: round3-pass-231
// @dev: round3-pass-232
// @dev: round3-pass-233
// @dev: round3-pass-234
// @dev: round3-pass-235
// @dev: round3-pass-236
// @dev: round3-pass-237
// @dev: round3-pass-238
// @dev: round3-pass-239
// @dev: round3-pass-240
// @dev: round3-pass-241
// @dev: round3-pass-242
// @dev: round3-pass-243
// @dev: round3-pass-244
// @dev: round3-pass-245
// @dev: round3-pass-246
// @dev: round3-pass-247
// @dev: round3-pass-248
// @dev: round3-pass-249
// @dev: round3-pass-250
// @dev: round3-pass-251
// @dev: round3-pass-252
// @dev: round3-pass-253
// @dev: round3-pass-254
// @dev: round3-pass-255
// @dev: round3-pass-256
// @dev: round3-pass-257
// @dev: round3-pass-258
// @dev: round3-pass-259
// @dev: round3-pass-260
// @dev: round3-pass-261
// @dev: round3-pass-262
// @dev: round3-pass-263
// @dev: round3-pass-264
// @dev: round3-pass-265
// @dev: round3-pass-266
// @dev: round3-pass-267
// @dev: round3-pass-268
// @dev: round3-pass-269
// @dev: round3-pass-270
// @dev: round3-pass-271
// @dev: round3-pass-272
// @dev: round3-pass-273
// @dev: round3-pass-274
// @dev: round3-pass-275
// @dev: round3-pass-276
// @dev: round3-pass-277
// @dev: round3-pass-278
// @dev: round3-pass-279
// @dev: round3-pass-280
// @dev: round3-pass-281
// @dev: round3-pass-282
// @dev: round3-pass-283
// @dev: round3-pass-284
// @dev: round3-pass-285
// @dev: round3-pass-286
// @dev: round3-pass-287
// @dev: round3-pass-288
// @dev: round3-pass-289
// @dev: round3-pass-290
// @dev: round3-pass-291
// @dev: round3-pass-292
// @dev: round3-pass-293
// @dev: round3-pass-294
