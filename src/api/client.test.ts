import { VisitorStore } from "../state/visitor";
import { createWidgetClient } from "./client";

type Handler = (url: string, init: RequestInit) => Response | Promise<Response>;

function createFetchMock(handler: Handler) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fn = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input.toString();
    const requestInit = init ?? {};
    calls.push({ url, init: requestInit });
    return handler(url, requestInit);
  }) as typeof fetch;
  return { fn, calls };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function streamResponse(chunks: string[]): Response {
  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(encoder.encode(chunk));
      controller.close();
    },
  });
  return new Response(body, { status: 200 });
}

function header(init: RequestInit, name: string): string | null {
  return new Headers(init.headers).get(name);
}

function session(visitorToken = "v1"): Response {
  return jsonResponse({ visitor_token: visitorToken, expires_in: 3600, tenant_id: 7 });
}

function setup(handler: Handler) {
  const store = new VisitorStore(window.localStorage, "pk_1");
  const mock = createFetchMock(handler);
  const client = createWidgetClient({
    apiUrl: "https://api.example.com/",
    embedKey: "pk_1",
    visitor: store,
    fetchImpl: mock.fn,
  });
  return { client, store, mock };
}

beforeEach(() => {
  window.localStorage.clear();
});

describe("createWidgetClient", () => {
  it("loads the config with the embed key", async () => {
    const { client, mock } = setup(() =>
      jsonResponse({ tenant_name: "Acme", default_locale: "it", answer_mode: "strict" }),
    );

    const config = await client.getConfig();

    expect(config.tenant_name).toBe("Acme");
    expect(mock.calls[0].url).toBe("https://api.example.com/api/v1/widget/config");
    expect(header(mock.calls[0].init, "X-Embed-Key")).toBe("pk_1");
  });

  it("creates a session and stores the visitor token", async () => {
    const { client, store, mock } = setup(() => session());

    const created = await client.createSession();

    expect(created.visitor_token).toBe("v1");
    expect(store.getToken()).toBe("v1");
    expect(store.isTokenValid()).toBe(true);
    expect(mock.calls[0].init.method).toBe("POST");
  });

  it("reuses a valid token without minting a new session", async () => {
    const { client, store, mock } = setup(() => session("fresh"));
    store.setSession("existing", 3600);

    const token = await client.ensureSession();

    expect(token).toBe("existing");
    expect(mock.calls).toHaveLength(0);
  });

  it("mints a session when no valid token is stored", async () => {
    const { client, mock } = setup(() => session("new"));

    const token = await client.ensureSession();

    expect(token).toBe("new");
    expect(mock.calls[0].url).toBe("https://api.example.com/api/v1/widget/session");
  });

  it("sends the visitor token and body for a chat", async () => {
    const { client, store, mock } = setup((url) =>
      url.endsWith("/chat")
        ? jsonResponse({
            conversation_id: 5,
            answer: "hi",
            provider: "ollama",
            model: "llama3.2",
            grounded: true,
            sources: [],
          })
        : session(),
    );
    store.setSession("v", 3600);

    const response = await client.chat({ message: "hello" });

    expect(response.conversation_id).toBe(5);
    const chatCall = mock.calls.find((call) => call.url.endsWith("/chat"));
    expect(header(chatCall?.init ?? {}, "X-Visitor-Token")).toBe("v");
    expect(JSON.parse(String(chatCall?.init.body))).toEqual({ message: "hello" });
  });

  it("clears the token and retries once on 401", async () => {
    let chatCalls = 0;
    const { client, store, mock } = setup((url) => {
      if (url.endsWith("/session")) return session("fresh");
      chatCalls += 1;
      return chatCalls === 1
        ? jsonResponse({ code: "INVALID_TOKEN", message: "expired" }, 401)
        : jsonResponse({
            conversation_id: 1,
            answer: "ok",
            provider: "p",
            model: "m",
            grounded: false,
            sources: [],
          });
    });
    store.setSession("stale", 3600);

    const response = await client.chat({ message: "hi" });

    expect(response.answer).toBe("ok");
    expect(chatCalls).toBe(2);
    expect(store.getToken()).toBe("fresh");
    expect(mock.calls.filter((call) => call.url.endsWith("/session"))).toHaveLength(1);
  });

  it("maps API errors to ApiError with the stable code", async () => {
    const { client } = setup(() =>
      jsonResponse({ code: "RATE_LIMITED", message: "Too many requests" }, 429),
    );

    await expect(client.getConfig()).rejects.toMatchObject({
      status: 429,
      code: "RATE_LIMITED",
    });
  });

  it("falls back when the error body is not JSON", async () => {
    const { client } = setup(
      () => new Response("boom", { status: 500, statusText: "Server Error" }),
    );

    await expect(client.getConfig()).rejects.toMatchObject({
      status: 500,
      code: "HTTP_ERROR",
    });
  });

  it("maps a network failure to ApiError", async () => {
    const { client } = setup(() => {
      throw new TypeError("failed to fetch");
    });

    await expect(client.getConfig()).rejects.toMatchObject({
      status: 0,
      code: "NETWORK_ERROR",
    });
  });

  it("streams chat events and sends the visitor token", async () => {
    const { client, store, mock } = setup((url) =>
      url.endsWith("/session")
        ? session("v")
        : streamResponse([
            'event: sources\ndata: {"conversation_id":9,"grounded":true,"sources":[]}\n\n',
            'event: token\ndata: {"text":"ciao"}\n\n',
            'event: done\ndata: {"provider":"ollama","model":"llama3.2","grounded":true}\n\n',
          ]),
    );
    store.setSession("v", 3600);
    const tokens: string[] = [];
    let conversationId = 0;
    let done = false;

    await client.streamChat(
      { message: "hey", conversation_id: null },
      {
        onSources: (payload) => {
          conversationId = payload.conversation_id;
        },
        onToken: (text) => tokens.push(text),
        onDone: () => {
          done = true;
        },
      },
    );

    expect(conversationId).toBe(9);
    expect(tokens).toEqual(["ciao"]);
    expect(done).toBe(true);
    const streamCall = mock.calls.find((call) => call.url.endsWith("/chat/stream"));
    expect(header(streamCall?.init ?? {}, "X-Visitor-Token")).toBe("v");
    expect(header(streamCall?.init ?? {}, "Accept")).toBe("text/event-stream");
  });

  it("passes pagination params to listConversations", async () => {
    const { client, store, mock } = setup(() => jsonResponse([]));
    store.setSession("v", 3600);

    await client.listConversations({ limit: 10, offset: 20 });

    expect(mock.calls[0].url).toBe(
      "https://api.example.com/api/v1/widget/conversations?limit=10&offset=20",
    );
  });

  it("loads a single conversation", async () => {
    const { client, store, mock } = setup(() =>
      jsonResponse({
        id: 3,
        tenant_id: 7,
        user_id: null,
        end_user_id: "x",
        title: null,
        created_at: "t",
        updated_at: "t",
        messages: [],
      }),
    );
    store.setSession("v", 3600);

    const conversation = await client.getConversation(3);

    expect(conversation.id).toBe(3);
    expect(mock.calls[0].url).toBe(
      "https://api.example.com/api/v1/widget/conversations/3",
    );
  });
});
