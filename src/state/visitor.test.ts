import { TOKEN_REFRESH_MARGIN_MS, VisitorStore } from "./visitor";

describe("VisitorStore", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("stores and reads a session token with its expiry", () => {
    const store = new VisitorStore(window.localStorage, "pk_1");
    store.setSession("tok", 3600, 1000);

    expect(store.getToken()).toBe("tok");
    expect(store.isTokenValid(1000)).toBe(true);
  });

  it("invalidates an expired token", () => {
    const store = new VisitorStore(window.localStorage, "pk_1");
    store.setSession("tok", 10, 1000);

    expect(store.isTokenValid(1000 + 10_000)).toBe(false);
  });

  it("invalidates a token inside the refresh margin", () => {
    const store = new VisitorStore(window.localStorage, "pk_1");
    store.setSession("tok", 3600, 0);
    const expiry = 3600 * 1000;

    expect(store.isTokenValid(expiry - TOKEN_REFRESH_MARGIN_MS)).toBe(false);
    expect(store.isTokenValid(expiry - TOKEN_REFRESH_MARGIN_MS - 1)).toBe(true);
  });

  it("is invalid when no token is stored", () => {
    const store = new VisitorStore(window.localStorage, "pk_1");
    expect(store.isTokenValid()).toBe(false);
  });

  it("is invalid when the expiry is missing or corrupt", () => {
    const store = new VisitorStore(window.localStorage, "pk_1");
    window.localStorage.setItem("embed-rag-chatbot:pk_1:visitor-token", "tok");
    expect(store.isTokenValid()).toBe(false);

    window.localStorage.setItem("embed-rag-chatbot:pk_1:visitor-expires", "nope");
    expect(store.isTokenValid()).toBe(false);
  });

  it("clears the token and its expiry", () => {
    const store = new VisitorStore(window.localStorage, "pk_1");
    store.setSession("tok", 3600);

    store.clearToken();

    expect(store.getToken()).toBeNull();
    expect(store.isTokenValid()).toBe(false);
  });

  it("namespaces state per embed key", () => {
    const first = new VisitorStore(window.localStorage, "pk_a");
    const second = new VisitorStore(window.localStorage, "pk_b");
    first.setSession("token-a", 3600);

    expect(first.getToken()).toBe("token-a");
    expect(second.getToken()).toBeNull();
  });

  it("stores, reads and clears the conversation id", () => {
    const store = new VisitorStore(window.localStorage, "pk_1");
    expect(store.getConversationId()).toBeNull();

    store.setConversationId(42);
    expect(store.getConversationId()).toBe(42);

    store.clearConversationId();
    expect(store.getConversationId()).toBeNull();
  });

  it("ignores a corrupt conversation id", () => {
    const store = new VisitorStore(window.localStorage, "pk_1");
    window.localStorage.setItem("embed-rag-chatbot:pk_1:conversation", "abc");

    expect(store.getConversationId()).toBeNull();
  });
});
