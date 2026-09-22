import { errorMessageKey, type Translator } from "../i18n";
import type { ChatEntry } from "../state/useChat";
import { Sources } from "./Sources";

export interface MessageBubbleProps {
  entry: ChatEntry;
  t: Translator;
}

export function MessageBubble({ entry, t }: MessageBubbleProps) {
  const searching =
    entry.role === "assistant" && entry.pending && entry.content === "" && !entry.error;
  const classes = ["erc-bubble", `erc-bubble--${entry.role}`];
  if (entry.error) classes.push("erc-bubble--error");

  return (
    <div class={classes.join(" ")}>
      {searching ? (
        <span class="erc-searching">{t("searching")}</span>
      ) : (
        <span class="erc-text">{entry.content}</span>
      )}
      {entry.error ? (
        <span class="erc-error-text">{t(errorMessageKey(entry.error))}</span>
      ) : null}
      {entry.sources.length > 0 ? (
        <Sources label={t("sources")} sources={entry.sources} />
      ) : null}
    </div>
  );
}
