const TOKEN_SUFFIX = ":visitor-token";
const EXPIRES_SUFFIX = ":visitor-expires";
const CONVERSATION_SUFFIX = ":conversation";

export const TOKEN_REFRESH_MARGIN_MS = 60_000;

export class VisitorStore {
  constructor(
    private readonly storage: Storage,
    private readonly embedKey: string,
  ) {}

  private key(suffix: string): string {
    return `embed-rag-chatbot:${this.embedKey}${suffix}`;
  }

  getToken(): string | null {
    return this.storage.getItem(this.key(TOKEN_SUFFIX));
  }

  setSession(token: string, expiresInSeconds: number, now = Date.now()): void {
    this.storage.setItem(this.key(TOKEN_SUFFIX), token);
    this.storage.setItem(this.key(EXPIRES_SUFFIX), String(now + expiresInSeconds * 1000));
  }

  isTokenValid(now = Date.now()): boolean {
    if (this.getToken() === null) return false;
    const raw = this.storage.getItem(this.key(EXPIRES_SUFFIX));
    const expiresAt = raw === null ? Number.NaN : Number(raw);
    if (!Number.isFinite(expiresAt)) return false;
    return expiresAt - TOKEN_REFRESH_MARGIN_MS > now;
  }

  clearToken(): void {
    this.storage.removeItem(this.key(TOKEN_SUFFIX));
    this.storage.removeItem(this.key(EXPIRES_SUFFIX));
  }

  getConversationId(): number | null {
    const raw = this.storage.getItem(this.key(CONVERSATION_SUFFIX));
    if (raw === null) return null;
    const value = Number(raw);
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  setConversationId(conversationId: number): void {
    this.storage.setItem(this.key(CONVERSATION_SUFFIX), String(conversationId));
  }

  clearConversationId(): void {
    this.storage.removeItem(this.key(CONVERSATION_SUFFIX));
  }
}
