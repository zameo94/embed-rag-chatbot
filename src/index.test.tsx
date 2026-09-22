import { ELEMENT_TAG, EmbedRagChatbotElement, register } from "./index";

describe("embed-rag-chatbot", () => {
  it("registers the custom element", () => {
    register();
    expect(customElements.get(ELEMENT_TAG)).toBe(EmbedRagChatbotElement);
  });

  it("renders into an open shadow root", () => {
    const element = document.createElement(ELEMENT_TAG) as EmbedRagChatbotElement;
    document.body.append(element);
    expect(element.shadowRoot).not.toBeNull();
    expect(element.shadowRoot?.textContent).toContain("embed-rag-chatbot");
  });
});
