import type { Translator } from "../i18n";
import type { ChatEntry } from "../state/useChat";
import { MessageBubble } from "./MessageBubble";

export interface MessageListProps {
  messages: ChatEntry[];
  welcome: string;
  t: Translator;
}

export function MessageList({ messages, welcome, t }: MessageListProps) {
  return (
    <div class="erc-messages" role="log" aria-live="polite">
      {messages.length === 0 ? (
        <div class="erc-bubble erc-bubble--assistant">{welcome}</div>
      ) : null}
      {messages.map((entry) => (
        <MessageBubble key={entry.id} entry={entry} t={t} />
      ))}
    </div>
  );
}
