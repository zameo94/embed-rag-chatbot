import { useState } from "preact/hooks";

import { SendIcon } from "./icons";

export interface ComposerProps {
  disabled: boolean;
  placeholder: string;
  sendLabel: string;
  onSend: (text: string) => void;
}

export function Composer({ disabled, placeholder, sendLabel, onSend }: ComposerProps) {
  const [value, setValue] = useState("");

  function submit(event: Event): void {
    event.preventDefault();
    const text = value.trim();
    if (text === "" || disabled) return;
    setValue("");
    onSend(text);
  }

  return (
    <form class="erc-composer" onSubmit={submit}>
      <input
        class="erc-input"
        type="text"
        value={value}
        placeholder={placeholder}
        aria-label={placeholder}
        disabled={disabled}
        onInput={(event) => setValue((event.target as HTMLInputElement).value)}
      />
      <button
        type="submit"
        class="erc-send"
        aria-label={sendLabel}
        disabled={disabled || value.trim() === ""}
      >
        <SendIcon />
      </button>
    </form>
  );
}
