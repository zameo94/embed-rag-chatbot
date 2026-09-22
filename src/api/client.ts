import type { VisitorStore } from "../state/visitor";
import { ApiError, type ApiErrorPayload } from "./errors";
import { consumeSseStream, type ChatStreamHandlers } from "./sse";
import type {
  ChatRequest,
  ChatResponse,
  Conversation,
  ConversationDetail,
  WidgetConfig,
  WidgetSession,
} from "./types";

const API_PREFIX = "/api/v1/widget";

export interface ListParams {
  limit?: number;
  offset?: number;
}

export interface WidgetClientOptions {
  apiUrl: string;
  embedKey: string;
  visitor: VisitorStore;
  fetchImpl?: typeof fetch;
}

export interface WidgetClient {
  getConfig(): Promise<WidgetConfig>;
  createSession(): Promise<WidgetSession>;
  ensureSession(): Promise<string>;
  chat(request: ChatRequest): Promise<ChatResponse>;
  streamChat(request: ChatRequest, handlers: ChatStreamHandlers): Promise<void>;
  listConversations(params?: ListParams): Promise<Conversation[]>;
  getConversation(conversationId: number): Promise<ConversationDetail>;
}

async function toApiError(response: Response): Promise<ApiError> {
  let payload: ApiErrorPayload = {
    code: "HTTP_ERROR",
    message: response.statusText || "Request failed",
  };
  try {
    const data = (await response.json()) as Partial<ApiErrorPayload> | null;
    if (data && typeof data.code === "string") {
      payload = {
        code: data.code,
        message: typeof data.message === "string" ? data.message : payload.message,
        details: data.details,
      };
    }
  } catch {
    // keep fallback payload
  }
  return new ApiError(response.status, payload);
}

function buildQuery(params?: ListParams): string {
  if (!params) return "";
  const search = new URLSearchParams();
  if (params.limit !== undefined) search.set("limit", String(params.limit));
  if (params.offset !== undefined) search.set("offset", String(params.offset));
  const query = search.toString();
  return query ? `?${query}` : "";
}

export function createWidgetClient(options: WidgetClientOptions): WidgetClient {
  const fetchImpl = options.fetchImpl ?? fetch;
  const baseUrl = `${options.apiUrl.replace(/\/+$/, "")}${API_PREFIX}`;
  const { embedKey, visitor } = options;

  async function send(
    path: string,
    init: RequestInit,
    token?: string,
  ): Promise<Response> {
    const headers = new Headers(init.headers);
    headers.set("X-Embed-Key", embedKey);
    if (token) headers.set("X-Visitor-Token", token);

    let response: Response;
    try {
      response = await fetchImpl(`${baseUrl}${path}`, { ...init, headers });
    } catch {
      throw new ApiError(0, {
        code: "NETWORK_ERROR",
        message: "The request could not be completed.",
      });
    }
    if (!response.ok) throw await toApiError(response);
    return response;
  }

  async function json<T>(path: string, init: RequestInit, token?: string): Promise<T> {
    const response = await send(path, init, token);
    return (await response.json()) as T;
  }

  async function createSession(): Promise<WidgetSession> {
    const session = await json<WidgetSession>("/session", { method: "POST" });
    visitor.setSession(session.visitor_token, session.expires_in);
    return session;
  }

  async function ensureSession(): Promise<string> {
    const existing = visitor.getToken();
    if (existing !== null && visitor.isTokenValid()) return existing;
    const session = await createSession();
    return session.visitor_token;
  }

  async function authed<T>(run: (token: string) => Promise<T>): Promise<T> {
    const token = await ensureSession();
    try {
      return await run(token);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        visitor.clearToken();
        return run(await ensureSession());
      }
      throw err;
    }
  }

  const jsonPost = (body: unknown): RequestInit => ({
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return {
    getConfig: () => json<WidgetConfig>("/config", { method: "GET" }),
    createSession,
    ensureSession,
    chat: (request) =>
      authed((token) => json<ChatResponse>("/chat", jsonPost(request), token)),
    streamChat: (request, handlers) =>
      authed(async (token) => {
        const response = await send(
          "/chat/stream",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "text/event-stream",
            },
            body: JSON.stringify(request),
          },
          token,
        );
        if (!response.body) {
          throw new ApiError(0, {
            code: "NETWORK_ERROR",
            message: "The response has no body",
          });
        }
        await consumeSseStream(response.body, handlers);
      }),
    listConversations: (params) =>
      authed((token) =>
        json<Conversation[]>(
          `/conversations${buildQuery(params)}`,
          { method: "GET" },
          token,
        ),
      ),
    getConversation: (conversationId) =>
      authed((token) =>
        json<ConversationDetail>(
          `/conversations/${conversationId}`,
          { method: "GET" },
          token,
        ),
      ),
  };
}
