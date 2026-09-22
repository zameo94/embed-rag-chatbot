export const WIDGET_CSS = `
:host {
  all: initial;
  --erc-primary: #2563eb;
  --erc-radius: 12px;
}

.erc-root {
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.45;
  color: #0f172a;
}

.erc-launcher {
  position: fixed;
  bottom: 20px;
  width: 56px;
  height: 56px;
  border: none;
  border-radius: 50%;
  background: var(--erc-primary);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.3);
  z-index: 2147483000;
}

.erc-root--bottom-right .erc-launcher { right: 20px; }
.erc-root--bottom-left .erc-launcher { left: 20px; }
.erc-launcher svg { width: 24px; height: 24px; }

.erc-panel {
  position: fixed;
  bottom: 88px;
  width: 360px;
  max-width: calc(100vw - 32px);
  height: 520px;
  max-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
  background: #fff;
  border-radius: var(--erc-radius);
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.25);
  overflow: hidden;
  z-index: 2147483000;
}

.erc-root--bottom-right .erc-panel { right: 20px; }
.erc-root--bottom-left .erc-panel { left: 20px; }

.erc-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 14px;
  background: var(--erc-primary);
  color: #fff;
}

.erc-title {
  flex: 1;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.erc-header button {
  border: none;
  background: transparent;
  color: #fff;
  cursor: pointer;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.erc-header button:hover { background: rgba(255, 255, 255, 0.2); }
.erc-header svg { width: 18px; height: 18px; }

.erc-messages {
  flex: 1;
  overflow-y: auto;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.erc-bubble {
  max-width: 85%;
  padding: 9px 12px;
  border-radius: 12px;
  white-space: pre-wrap;
  word-break: break-word;
}

.erc-bubble--assistant { align-self: flex-start; background: #f1f5f9; }
.erc-bubble--user { align-self: flex-end; background: var(--erc-primary); color: #fff; }
.erc-bubble--error { background: #fef2f2; color: #991b1b; }
.erc-searching { opacity: 0.6; font-style: italic; }
.erc-error-text { display: block; margin-top: 4px; }

.erc-sources { margin-top: 8px; font-size: 12px; opacity: 0.85; }
.erc-sources__label { font-weight: 600; }
.erc-sources ul { margin: 4px 0 0; padding-left: 16px; }

.erc-composer {
  display: flex;
  gap: 8px;
  padding: 10px;
  border-top: 1px solid #e2e8f0;
}

.erc-input {
  flex: 1;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 8px 10px;
  font: inherit;
  color: inherit;
  outline: none;
}

.erc-input:focus { border-color: var(--erc-primary); }

.erc-send {
  border: none;
  background: var(--erc-primary);
  color: #fff;
  border-radius: 8px;
  width: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.erc-send:disabled { opacity: 0.5; cursor: default; }
.erc-send svg { width: 18px; height: 18px; }
`;

export function injectStyles(root: ShadowRoot): void {
  const style = document.createElement("style");
  style.textContent = WIDGET_CSS;
  root.append(style);
}
