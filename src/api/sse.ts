import { ApiError } from "./errors";
import type { DoneEventPayload, ErrorEventPayload, SourcesEventPayload } from "./types";

export interface ChatStreamHandlers {
  onSources?: (payload: SourcesEventPayload) => void;
  onToken?: (text: string) => void;
  onDone?: (payload: DoneEventPayload) => void;
  onError?: (payload: ErrorEventPayload) => void;
}

export interface ParsedEvent {
  event: string;
  data: Record<string, unknown>;
}

export function parseSseChunk(buffer: string): { events: ParsedEvent[]; rest: string } {
  const events: ParsedEvent[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";

  for (const part of parts) {
    const lines = part.split("\n");
    const eventLine = lines.find((line) => line.startsWith("event: "));
    if (!eventLine) continue;
    const dataLines = lines
      .filter((line) => line.startsWith("data: "))
      .map((line) => line.slice("data: ".length));
    let data: Record<string, unknown> = {};
    if (dataLines.length > 0) {
      try {
        data = JSON.parse(dataLines.join("\n")) as Record<string, unknown>;
      } catch {
        data = {};
      }
    }
    events.push({ event: eventLine.slice("event: ".length), data });
  }

  return { events, rest };
}

function dispatch(event: ParsedEvent, handlers: ChatStreamHandlers): void {
  switch (event.event) {
    case "sources":
      handlers.onSources?.(event.data as unknown as SourcesEventPayload);
      break;
    case "token":
      handlers.onToken?.(String(event.data.text ?? ""));
      break;
    case "done":
      handlers.onDone?.(event.data as unknown as DoneEventPayload);
      break;
    case "error":
      handlers.onError?.(event.data as unknown as ErrorEventPayload);
      break;
    default:
      break;
  }
}

export async function consumeSseStream(
  body: ReadableStream<Uint8Array>,
  handlers: ChatStreamHandlers,
): Promise<void> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let finished = false;

  const handle = (event: ParsedEvent): void => {
    dispatch(event, handlers);
    if (event.event === "done" || event.event === "error") finished = true;
  };

  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parsed = parseSseChunk(buffer);
      buffer = parsed.rest;
      for (const event of parsed.events) handle(event);
    }
    if (buffer.trim()) {
      const parsed = parseSseChunk(`${buffer}\n\n`);
      for (const event of parsed.events) handle(event);
    }
    if (!finished) {
      throw new ApiError(0, {
        code: "STREAM_INCOMPLETE",
        message: "The connection ended before the answer completed.",
      });
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(0, {
      code: "NETWORK_ERROR",
      message: "The connection was interrupted.",
    });
  } finally {
    reader.releaseLock();
  }
}
