import { ChatIcon, CloseIcon } from "./icons";

export interface LauncherProps {
  open: boolean;
  label: string;
  onClick: () => void;
}

export function Launcher({ open, label, onClick }: LauncherProps) {
  return (
    <button
      type="button"
      class="erc-launcher"
      aria-label={label}
      aria-expanded={open}
      onClick={onClick}
    >
      {open ? <CloseIcon /> : <ChatIcon />}
    </button>
  );
}
