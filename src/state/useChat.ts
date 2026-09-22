import { useCallback, useRef, useState } from "preact/hooks";

import type { WidgetClient } from "../api/client";
import { ApiError } from "../api/errors";
import type { ChatSource } from "../api/types";
import type { VisitorStore } from "./visitor";

export type ChatStatus = "idle" | "sending" | "streaming";

export interface ChatEntry {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources: ChatSource[];
  error: string | null;
  pending: boolean;
}

export interface UseChat {
  messages: ChatEntry[];
  status: ChatStatus;
  conversationId: number | null;
  send: (text: string) => Promise<void>;
  reset: () => void;
}

export function useChat(
  client: WidgetClient,
  visitor: VisitorStore,
  locale?: string,
): UseChat {
  const [messages, setMessages] = useState<ChatEntry[]>([]);
  const [status, setStatus] = useState<ChatStatus>("idle");
  const [conversationId, setConversationId] = useState<number | null>(
    visitor.getConversationId(),
  );
  const sequence = useRef(0);
  const generation = useRef(0);
  const busy = useRef(false);

  const nextId = useCallback((): string => {
    sequence.current += 1;
    return `m${sequence.current}`;
  }, []);

  const updateLast = useCallback((updater: (entry: ChatEntry) => ChatEntry) => {
    setMessages((previous) => {
      if (previous.length === 0) return previous;
      const next = previous.slice();
      next[next.length - 1] = updater(next[next.length - 1]);
      return next;
    });
  }, []);

  const send = useCallback(
    async (text: string): Promise<void> => {
      const trimmed = text.trim();
      if (trimmed === "" || busy.current) return;

      busy.current = true;
      const run = ++generation.current;
      const isCurrent = (): boolean => generation.current === run;

      setMessages((previous) => [
        ...previous,
        {
          id: nextId(),
          role: "user",
          content: trimmed,
          sources: [],
          error: null,
          pending: false,
        },
        {
          id: nextId(),
          role: "assistant",
          content: "",
          sources: [],
          error: null,
          pending: true,
        },
      ]);
      setStatus("sending");

      try {
        await client.streamChat(
          { message: trimmed, conversation_id: conversationId, locale },
          {
            onSources: (payload) => {
              if (!isCurrent()) return;
              setConversationId(payload.conversation_id);
              visitor.setConversationId(payload.conversation_id);
              updateLast((entry) => ({ ...entry, sources: payload.sources }));
            },
            onToken: (token) => {
              if (!isCurrent()) return;
              setStatus("streaming");
              updateLast((entry) => ({ ...entry, content: entry.content + token }));
            },
            onDone: () => {
              if (!isCurrent()) return;
              updateLast((entry) => ({ ...entry, pending: false }));
            },
            onError: (payload) => {
              if (!isCurrent()) return;
              updateLast((entry) => ({
                ...entry,
                pending: false,
                error: payload.code,
              }));
            },
          },
        );
      } catch (error) {
        if (isCurrent()) {
          const code = error instanceof ApiError ? error.code : "NETWORK_ERROR";
          updateLast((entry) => ({ ...entry, pending: false, error: code }));
        }
      } finally {
        if (isCurrent()) {
          busy.current = false;
          setStatus("idle");
        }
      }
    },
    [client, conversationId, locale, nextId, updateLast, visitor],
  );

  const reset = useCallback((): void => {
    generation.current += 1;
    busy.current = false;
    setMessages([]);
    setConversationId(null);
    visitor.clearConversationId();
    setStatus("idle");
  }, [visitor]);

  return { messages, status, conversationId, send, reset };
}
