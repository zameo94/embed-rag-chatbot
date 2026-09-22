import { render } from "preact";

export const ELEMENT_TAG = "embed-rag-chatbot";

export class EmbedRagChatbotElement extends HTMLElement {
  connectedCallback(): void {
    if (this.shadowRoot) return;
    const root = this.attachShadow({ mode: "open" });
    render(<div>embed-rag-chatbot</div>, root);
  }
}

export function register(): void {
  if (!customElements.get(ELEMENT_TAG)) {
    customElements.define(ELEMENT_TAG, EmbedRagChatbotElement);
  }
}

register();
