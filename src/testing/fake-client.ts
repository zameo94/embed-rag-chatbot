import { vi } from "vitest";

import type { WidgetClient } from "../api/client";
import type { ChatStreamHandlers } from "../api/sse";
import type { ChatRequest, WidgetConfig } from "../api/types";

export interface FakeClientOptions {
  config?: WidgetConfig;
  onStream?: (request: ChatRequest, handlers: ChatStreamHandlers) => void | Promise<void>;
}

export const DEFAULT_CONFIG: WidgetConfig = {
  tenant_name: "Acme",
  default_locale: "it",
  answer_mode: "strict",
};

export function createFakeClient(options: FakeClientOptions = {}) {
  const config = options.config ?? DEFAULT_CONFIG;
  const streamChat = vi.fn(
    async (request: ChatRequest, handlers: ChatStreamHandlers): Promise<void> => {
      await options.onStream?.(request, handlers);
    },
  );

  const client = {
    getConfig: vi.fn(async () => config),
    createSession: vi.fn(async () => ({
      visitor_token: "visitor",
      expires_in: 3600,
      tenant_id: 7,
    })),
    ensureSession: vi.fn(async () => "visitor"),
    chat: vi.fn(),
    streamChat,
    listConversations: vi.fn(async () => []),
    getConversation: vi.fn(),
  } as unknown as WidgetClient;

  return { client, streamChat };
}
