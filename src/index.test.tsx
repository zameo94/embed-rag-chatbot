import { waitFor } from "@testing-library/preact";

import { ELEMENT_TAG, EmbedRagChatbotElement, register } from "./index";

describe("embed-rag-chatbot element", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "fetch",
      vi.fn(() => Promise.reject(new Error("offline"))),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("registers the custom element", () => {
    register();
    expect(customElements.get(ELEMENT_TAG)).toBe(EmbedRagChatbotElement);
  });

  it("mounts the widget into an open shadow root when configured", async () => {
    const element = document.createElement(ELEMENT_TAG) as EmbedRagChatbotElement;
    element.dataset.embedKey = "pk_test";
    element.dataset.apiUrl = "https://api.example.com";
    document.body.append(element);

    await waitFor(() => {
      expect(element.shadowRoot?.querySelector("button")).not.toBeNull();
    });
  });

  it("does not mount without the required data attributes", () => {
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const element = document.createElement(ELEMENT_TAG);

    document.body.append(element);

    expect(element.shadowRoot).toBeNull();
    expect(error).toHaveBeenCalled();
    error.mockRestore();
  });
});
