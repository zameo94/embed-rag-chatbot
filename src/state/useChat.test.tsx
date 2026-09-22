import { act, renderHook } from "@testing-library/preact";

import { ApiError } from "../api/errors";
import type { ChatStreamHandlers } from "../api/sse";
import { createFakeClient } from "../testing/fake-client";
import { useChat } from "./useChat";
import { VisitorStore } from "./visitor";

function setup(
  onStream?: (request: unknown, handlers: ChatStreamHandlers) => void | Promise<void>,
) {
  window.localStorage.clear();
  const visitor = new VisitorStore(window.localStorage, "pk_1");
  const fake = createFakeClient({ onStream });
  const hook = renderHook(() => useChat(fake.client, visitor));
  return { ...hook, visitor, fake };
}

describe("useChat", () => {
  it("streams a reply and persists the conversation id", async () => {
    const { result, visitor } = setup((_request, handlers) => {
      handlers.onSources?.({
        conversation_id: 9,
        grounded: true,
        sources: [{ document_id: 1, filename: "a.pdf", chunk_index: 0, score: 0.9 }],
      });
      handlers.onToken?.("Hel");
      handlers.onToken?.("lo");
      handlers.onDone?.({ provider: "ollama", model: "llama3.2", grounded: true });
    });

    await act(async () => {
      await result.current.send("hi");
    });

    expect(result.current.messages.map((entry) => entry.role)).toEqual([
      "user",
      "assistant",
    ]);
    expect(result.current.messages[1].content).toBe("Hello");
    expect(result.current.messages[1].pending).toBe(false);
    expect(result.current.messages[1].sources).toHaveLength(1);
    expect(result.current.status).toBe("idle");
    expect(visitor.getConversationId()).toBe(9);
  });

  it("ignores blank messages", async () => {
    const { result, fake } = setup();

    await act(async () => {
      await result.current.send("   ");
    });

    expect(result.current.messages).toHaveLength(0);
    expect(fake.streamChat).not.toHaveBeenCalled();
  });

  it("records an error event on the assistant message", async () => {
    const { result } = setup((_request, handlers) => {
      handlers.onSources?.({ conversation_id: 9, grounded: false, sources: [] });
      handlers.onError?.({ code: "LLM_UNAVAILABLE", message: "down" });
    });

    await act(async () => {
      await result.current.send("hi");
    });

    expect(result.current.messages[1].error).toBe("LLM_UNAVAILABLE");
    expect(result.current.messages[1].pending).toBe(false);
    expect(result.current.status).toBe("idle");
  });

  it("maps a thrown ApiError to an error code", async () => {
    const { result } = setup(() => {
      throw new ApiError(0, { code: "NETWORK_ERROR", message: "offline" });
    });

    await act(async () => {
      await result.current.send("hi");
    });

    expect(result.current.messages[1].error).toBe("NETWORK_ERROR");
    expect(result.current.status).toBe("idle");
  });

  it("resets the conversation", async () => {
    const { result, visitor } = setup((_request, handlers) => {
      handlers.onDone?.({ provider: "p", model: "m", grounded: true });
    });

    await act(async () => {
      await result.current.send("hi");
    });
    act(() => {
      result.current.reset();
    });

    expect(result.current.messages).toHaveLength(0);
    expect(result.current.conversationId).toBeNull();
    expect(visitor.getConversationId()).toBeNull();
  });
});
