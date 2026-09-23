import type { Translator } from "../i18n";
import type { UseChat } from "../state/useChat";
import { Composer } from "./Composer";
import { CloseIcon, NewConversationIcon } from "./icons";
import { MessageList } from "./MessageList";

export interface PanelProps {
  title: string;
  welcome: string;
  t: Translator;
  chat: UseChat;
  onNewConversation: () => void;
  onClose: () => void;
}

export function Panel({
  title,
  welcome,
  t,
  chat,
  onNewConversation,
  onClose,
}: PanelProps) {
  return (
    <section class="erc-panel" role="dialog" aria-label={title}>
      <header class="erc-header">
        <span class="erc-title">{title}</span>
        <button
          type="button"
          aria-label={t("newConversation")}
          onClick={onNewConversation}
        >
          <NewConversationIcon />
        </button>
        <button type="button" aria-label={t("close")} onClick={onClose}>
          <CloseIcon />
        </button>
      </header>
      <MessageList messages={chat.messages} welcome={welcome} t={t} />
      <Composer
        disabled={chat.status !== "idle"}
        placeholder={t("placeholder")}
        sendLabel={t("send")}
        onSend={(text) => void chat.send(text)}
      />
    </section>
  );
}
