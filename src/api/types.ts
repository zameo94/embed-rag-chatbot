export type AnswerMode = "strict" | "assistive";

export interface WidgetConfig {
  workspace_name: string;
  default_locale: string;
  answer_mode: AnswerMode;
}

export interface WidgetSession {
  visitor_token: string;
  expires_in: number;
  workspace_id: number;
}

export interface ChatSource {
  document_id: number;
  filename: string;
  chunk_index: number;
  score: number;
}

export interface ChatRequest {
  message: string;
  conversation_id?: number | null;
  locale?: string;
}

export interface ChatResponse {
  conversation_id: number;
  answer: string;
  provider: string;
  model: string;
  grounded: boolean;
  sources: ChatSource[];
}

export type MessageRole = "user" | "assistant";

export interface ChatMessage {
  id: number;
  conversation_id: number;
  role: MessageRole;
  content: string;
  provider: string | null;
  model: string | null;
  grounded: boolean | null;
  error_code: string | null;
  sources: ChatSource[] | null;
  created_at: string;
}

export interface Conversation {
  id: number;
  workspace_id: number;
  user_id: number | null;
  end_user_id: string | null;
  title: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail extends Conversation {
  messages: ChatMessage[];
}

export interface SourcesEventPayload {
  conversation_id: number;
  grounded: boolean;
  sources: ChatSource[];
}

export interface DoneEventPayload {
  provider: string;
  model: string;
  grounded: boolean;
}

export interface ErrorEventPayload {
  code: string;
  message: string;
}
