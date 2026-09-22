import { render } from "preact";

export { createWidgetClient } from "./api/client";
export type { ListParams, WidgetClient, WidgetClientOptions } from "./api/client";
export { ApiError } from "./api/errors";
export type { ApiErrorPayload } from "./api/errors";
export { consumeSseStream, parseSseChunk } from "./api/sse";
export type { ChatStreamHandlers, ParsedEvent } from "./api/sse";
export type {
  AnswerMode,
  ChatMessage,
  ChatRequest,
  ChatResponse,
  ChatSource,
  Conversation,
  ConversationDetail,
  DoneEventPayload,
  ErrorEventPayload,
  MessageRole,
  SourcesEventPayload,
  WidgetConfig,
  WidgetSession,
} from "./api/types";
export { TOKEN_REFRESH_MARGIN_MS, VisitorStore } from "./state/visitor";

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
