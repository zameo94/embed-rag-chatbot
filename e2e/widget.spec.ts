import { expect, test, type Page } from "@playwright/test";

const ORIGIN = "http://localhost:5173";
const CONFIG = { tenant_name: "Acme", default_locale: "it", answer_mode: "strict" };

type SseEvent = [name: string, data: unknown];

function sse(events: SseEvent[]): string {
  return events
    .map(([name, data]) => `event: ${name}\ndata: ${JSON.stringify(data)}\n\n`)
    .join("");
}

async function mockWidgetApi(page: Page, streamBody: string): Promise<void> {
  await page.route("**/api/v1/widget/**", (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path.endsWith("/config")) {
      return route.fulfill({ json: CONFIG });
    }
    if (path.endsWith("/session")) {
      return route.fulfill({
        json: { visitor_token: "visitor", expires_in: 3600, tenant_id: 7 },
      });
    }
    if (path.endsWith("/chat/stream")) {
      return route.fulfill({
        status: 200,
        contentType: "text/event-stream",
        body: streamBody,
      });
    }
    return route.fulfill({
      status: 404,
      json: { code: "NOT_FOUND", message: "not mocked" },
    });
  });
}

async function openPanel(page: Page): Promise<void> {
  await page.goto(`/?key=pk_test&api=${encodeURIComponent(ORIGIN)}`);
  await page.getByRole("button", { name: "Apri la chat" }).click();
}

async function ask(page: Page, text: string): Promise<void> {
  const input = page.getByPlaceholder("Scrivi un messaggio…");
  await input.fill(text);
  await input.press("Enter");
}

test("opens the panel showing the tenant name", async ({ page }) => {
  await mockWidgetApi(page, sse([]));

  await openPanel(page);

  await expect(page.getByRole("dialog", { name: "Acme" })).toBeVisible();
});

test("streams a grounded reply with its sources", async ({ page }) => {
  await mockWidgetApi(
    page,
    sse([
      [
        "sources",
        {
          conversation_id: 9,
          grounded: true,
          sources: [
            { document_id: 1, filename: "manuale.pdf", chunk_index: 0, score: 0.8 },
          ],
        },
      ],
      ["token", { text: "Ciao" }],
      ["token", { text: " mondo" }],
      ["done", { provider: "ollama", model: "llama3.2", grounded: true }],
    ]),
  );

  await openPanel(page);
  await ask(page, "hey");

  await expect(page.getByText("Ciao mondo")).toBeVisible();
  await expect(page.getByText("manuale.pdf")).toBeVisible();
});

test("shows a translated error when the stream fails", async ({ page }) => {
  await mockWidgetApi(
    page,
    sse([
      ["sources", { conversation_id: 9, grounded: false, sources: [] }],
      ["error", { code: "RATE_LIMITED", message: "slow down" }],
    ]),
  );

  await openPanel(page);
  await ask(page, "hey");

  await expect(page.getByText("Troppi messaggi, attendi un momento.")).toBeVisible();
});
