import { fireEvent, render, screen, waitFor } from "@testing-library/preact";

import type { ChatStreamHandlers } from "../api/sse";
import type { WidgetOptions } from "../config";
import { VisitorStore } from "../state/visitor";
import { createFakeClient } from "../testing/fake-client";
import { Widget } from "./Widget";

const options: WidgetOptions = {
  embedKey: "pk_1",
  apiUrl: "https://api.example.com",
  locale: "it",
  position: "bottom-right",
  autoOpen: false,
};

function setup(
  onStream?: (request: unknown, handlers: ChatStreamHandlers) => void | Promise<void>,
) {
  window.localStorage.clear();
  const visitor = new VisitorStore(window.localStorage, "pk_1");
  const fake = createFakeClient({ onStream });
  const utils = render(
    <Widget client={fake.client} visitor={visitor} options={options} />,
  );
  return { ...utils, fake, visitor };
}

describe("Widget", () => {
  it("uses the workspace locale", async () => {
    window.localStorage.clear();
    const visitor = new VisitorStore(window.localStorage, "pk_1");
    const fake = createFakeClient({
      config: {
        workspace_name: "Acme",
        default_locale: "en",
        answer_mode: "strict",
        is_active: true,
      },
    });

    render(
      <Widget
        client={fake.client}
        visitor={visitor}
        options={{ ...options, locale: undefined }}
      />,
    );

    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Open chat" })).toBeInTheDocument(),
    );
  });

  it("opens the panel from the launcher", () => {
    const { getByRole, queryByRole } = setup();

    expect(queryByRole("dialog")).toBeNull();
    fireEvent.click(getByRole("button", { name: "Apri la chat" }));

    expect(getByRole("dialog")).not.toBeNull();
  });

  it("shows the workspace name as title once the config loads", async () => {
    const { getByRole } = setup();

    fireEvent.click(getByRole("button", { name: "Apri la chat" }));

    await waitFor(() => expect(getByRole("dialog", { name: "Acme" })).not.toBeNull());
  });

  it("sends a message and renders the streamed reply", async () => {
    const { getByRole, getByPlaceholderText, findByText } = setup(
      (_request, handlers) => {
        handlers.onSources?.({
          conversation_id: 9,
          grounded: true,
          sources: [
            { document_id: 1, filename: "manuale.pdf", chunk_index: 0, score: 0.8 },
          ],
        });
        handlers.onToken?.("Ciao");
        handlers.onDone?.({ provider: "p", model: "m", grounded: true });
      },
    );

    fireEvent.click(getByRole("button", { name: "Apri la chat" }));
    fireEvent.input(getByPlaceholderText("Scrivi un messaggio…"), {
      target: { value: "hey" },
    });
    fireEvent.submit(
      getByRole("button", { name: "Invia" }).closest("form") as HTMLFormElement,
    );

    expect(await findByText("Ciao")).toBeInTheDocument();
    expect(await findByText("manuale.pdf")).toBeInTheDocument();
  });

  it("shows a translated error when the reply fails", async () => {
    const { getByRole, getByPlaceholderText, findByText } = setup(
      (_request, handlers) => {
        handlers.onSources?.({ conversation_id: 9, grounded: false, sources: [] });
        handlers.onError?.({ code: "RATE_LIMITED", message: "slow down" });
      },
    );

    fireEvent.click(getByRole("button", { name: "Apri la chat" }));
    fireEvent.input(getByPlaceholderText("Scrivi un messaggio…"), {
      target: { value: "hey" },
    });
    fireEvent.submit(
      getByRole("button", { name: "Invia" }).closest("form") as HTMLFormElement,
    );

    expect(await findByText("Troppi messaggi, attendi un momento.")).toBeInTheDocument();
  });
});
