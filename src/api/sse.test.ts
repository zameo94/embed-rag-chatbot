import type { ChatStreamHandlers } from "./sse";
import { consumeSseStream, parseSseChunk } from "./sse";

function streamOf(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
}

describe("parseSseChunk", () => {
  it("parses one event and keeps the remainder buffered", () => {
    const { events, rest } = parseSseChunk(
      'event: token\ndata: {"text":"hi"}\n\npartial',
    );

    expect(events).toEqual([{ event: "token", data: { text: "hi" } }]);
    expect(rest).toBe("partial");
  });

  it("parses multiple events in one chunk", () => {
    const { events } = parseSseChunk(
      'event: sources\ndata: {"grounded":true}\n\nevent: done\ndata: {"grounded":true}\n\n',
    );

    expect(events.map((event) => event.event)).toEqual(["sources", "done"]);
  });

  it("joins multi-line data", () => {
    const { events } = parseSseChunk('event: token\ndata: {"text":\ndata: "a"}\n\n');

    expect(events).toEqual([{ event: "token", data: { text: "a" } }]);
  });

  it("falls back to empty data on invalid JSON", () => {
    const { events } = parseSseChunk("event: token\ndata: not-json\n\n");

    expect(events).toEqual([{ event: "token", data: {} }]);
  });

  it("ignores blocks without an event line", () => {
    const { events } = parseSseChunk('data: {"x":1}\n\n');

    expect(events).toEqual([]);
  });
});

describe("consumeSseStream", () => {
  it("dispatches sources, tokens and done in order", async () => {
    const seen: string[] = [];
    const handlers: ChatStreamHandlers = {
      onSources: () => seen.push("sources"),
      onToken: (text) => seen.push(`token:${text}`),
      onDone: () => seen.push("done"),
      onError: () => seen.push("error"),
    };

    await consumeSseStream(
      streamOf([
        'event: sources\ndata: {"conversation_id":1,"grounded":true,"sources":[]}\n\n',
        'event: token\ndata: {"text":"Hel"}\n\nevent: token\ndata: {"text":"lo"}\n\n',
        'event: done\ndata: {"provider":"ollama","model":"llama3.2","grounded":true}\n\n',
      ]),
      handlers,
    );

    expect(seen).toEqual(["sources", "token:Hel", "token:lo", "done"]);
  });

  it("handles events split across chunk boundaries", async () => {
    const tokens: string[] = [];

    await consumeSseStream(
      streamOf([
        'event: token\ndata: {"text"',
        ':"ab"}\n\nevent: done\ndata: {"provider":"x","model":"y","grounded":true}\n\n',
      ]),
      { onToken: (text) => tokens.push(text) },
    );

    expect(tokens).toEqual(["ab"]);
  });

  it("dispatches error events", async () => {
    let code = "";

    await consumeSseStream(
      streamOf(['event: error\ndata: {"code":"LLM_UNAVAILABLE","message":"down"}\n\n']),
      {
        onError: (payload) => {
          code = payload.code;
        },
      },
    );

    expect(code).toBe("LLM_UNAVAILABLE");
  });

  it("throws STREAM_INCOMPLETE when the stream ends without done or error", async () => {
    await expect(
      consumeSseStream(streamOf(['event: token\ndata: {"text":"a"}\n\n']), {}),
    ).rejects.toMatchObject({ status: 0, code: "STREAM_INCOMPLETE" });
  });
});
