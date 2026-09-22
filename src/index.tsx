import { render } from "preact";

import { createWidgetClient } from "./api/client";
import { isConfigured, parseOptions } from "./config";
import { injectStyles } from "./styles";
import { VisitorStore } from "./state/visitor";
import { themeVariables } from "./theme";
import { Widget } from "./ui/Widget";

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
export { isConfigured, parseOptions } from "./config";
export type { WidgetOptions, WidgetPosition } from "./config";
export { createTranslator, resolveLocale, translate } from "./i18n";
export type { Locale, MessageKey, Translator } from "./i18n";
export { useChat } from "./state/useChat";
export type { ChatEntry, ChatStatus, UseChat } from "./state/useChat";
export { TOKEN_REFRESH_MARGIN_MS, VisitorStore } from "./state/visitor";
export { themeVariables } from "./theme";

export const ELEMENT_TAG = "embed-rag-chatbot";

export class EmbedRagChatbotElement extends HTMLElement {
  connectedCallback(): void {
    if (this.shadowRoot) return;

    const options = parseOptions(this);
    if (!isConfigured(options)) {
      console.error("[embed-rag-chatbot] data-embed-key and data-api-url are required");
      return;
    }

    const root = this.attachShadow({ mode: "open" });
    injectStyles(root);
    for (const [name, value] of Object.entries(themeVariables(options))) {
      this.style.setProperty(name, value);
    }

    const visitor = new VisitorStore(window.localStorage, options.embedKey);
    const client = createWidgetClient({
      apiUrl: options.apiUrl,
      embedKey: options.embedKey,
      visitor,
    });

    render(<Widget client={client} visitor={visitor} options={options} />, root);
  }
}

export function register(): void {
  if (!customElements.get(ELEMENT_TAG)) {
    customElements.define(ELEMENT_TAG, EmbedRagChatbotElement);
  }
}

register();
