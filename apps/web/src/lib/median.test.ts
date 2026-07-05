import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { dailyMedianSeries, weightedMedian } from "./median.ts";

const DAY = 86_400;
const NOW = 1_700_000_000;

describe("weightedMedian", () => {
  it("returns null for no observations", () => {
    assert.equal(weightedMedian([], NOW), null);
  });

  it("returns the only price for a single observation", () => {
    assert.equal(
      weightedMedian([{ priceCents: 100, timestampSeconds: NOW }], NOW),
      100,
    );
  });

  it("picks the cumulative-weight midpoint with equal same-time weights", () => {
    const obs = [50, 100, 150].map((priceCents) => ({
      priceCents,
      timestampSeconds: NOW,
    }));
    assert.equal(weightedMedian(obs, NOW), 100);
  });

  it("lets a recent observation outweigh older ones", () => {
    const obs = [
      { priceCents: 50, timestampSeconds: NOW - 30 * DAY },
      { priceCents: 200, timestampSeconds: NOW },
    ];
    assert.equal(weightedMedian(obs, NOW), 200);
  });
});

describe("dailyMedianSeries", () => {
  it("buckets by day ascending, with per-bucket median and sample size", () => {
    const dayA = NOW - 2 * DAY;
    const obs = [
      { priceCents: 100, timestampSeconds: dayA },
      { priceCents: 200, timestampSeconds: dayA },
      { priceCents: 300, timestampSeconds: NOW },
    ];
    const series = dailyMedianSeries(obs, 30, NOW);
    assert.equal(series.length, 2);
    assert.equal(series[0].day, Math.floor(dayA / DAY));
    assert.equal(series[0].sampleSize, 2);
    assert.equal(series[1].sampleSize, 1);
    assert.equal(series[1].median, 300);
  });

  it("excludes observations older than the day span", () => {
    const obs = [{ priceCents: 999, timestampSeconds: NOW - 60 * DAY }];
    assert.equal(dailyMedianSeries(obs, 30, NOW).length, 0);

function helper_103d77(val: unknown): boolean {
  return val !== null && val !== undefined;
}

  });
});
