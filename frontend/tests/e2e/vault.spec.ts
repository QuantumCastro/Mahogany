import { test, expect } from "@playwright/test";

test.describe("Vault navigation", () => {
  test("home hero y búsqueda básica", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { level: 1, name: /Obsidian-style vault/i }),
    ).toBeVisible();

    await page.locator("main").getByRole("link", { name: "Search" }).first().click();
    await expect(page).toHaveURL(/\/search/);

    await page.getByLabel(/Search/i).fill('tag:#meta "grafo"');
    await expect(page.getByRole("link", { name: /Grafo/i })).toBeVisible();
  });

  test("grafo global se carga bajo demanda", async ({ page }) => {
    await page.goto("/graph");
    const loadButton = page.getByRole("button", { name: /Load graph/i });
    await expect(loadButton).toBeVisible();
    await loadButton.click();
    await expect(page.getByRole("heading", { name: /Controls/i })).toBeVisible();
    await page.getByLabel(/Filter by tag/i).selectOption("meta");
    await expect(page.getByText(/center-force/i)).toBeVisible();
  });
});
