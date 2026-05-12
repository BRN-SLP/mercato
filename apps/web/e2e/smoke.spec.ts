import { expect, test } from "@playwright/test";

test.describe("smoke", () => {
  test("home renders hero + CTA", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", {
        name: /scan a barcode\. share the price\. earn cusd\./i,
      }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: /scan a price/i }).first(),
    ).toBeVisible();
  });

  test("scan page mounts manual entry fallback", async ({ page }) => {
    await page.goto("/scan");
    await expect(
      page.getByRole("heading", { name: /scan a price/i }),
    ).toBeVisible();
  });

  test("rewards page prompts for wallet when disconnected", async ({ page }) => {
    await page.goto("/rewards");
    await expect(
      page.getByText(/connect your wallet to see pending rewards/i),
    ).toBeVisible();
  });

  test("item page rejects malformed barcode", async ({ page }) => {
    await page.goto("/item/not-a-hex");
    await expect(
      page.getByText(/invalid barcode in url/i),
    ).toBeVisible();
  });
});
