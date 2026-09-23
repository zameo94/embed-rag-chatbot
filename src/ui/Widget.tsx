import { useCallback, useEffect, useMemo, useState } from "preact/hooks";

import type { WidgetClient } from "../api/client";
import type { WidgetConfig } from "../api/types";
import type { WidgetOptions } from "../config";
import { createTranslator, resolveLocale, type Locale } from "../i18n";
import { useChat } from "../state/useChat";
import type { VisitorStore } from "../state/visitor";
import { Launcher } from "./Launcher";
import { Panel } from "./Panel";

export interface WidgetProps {
  client: WidgetClient;
  visitor: VisitorStore;
  options: WidgetOptions;
}

export function Widget({ client, visitor, options }: WidgetProps) {
  const [config, setConfig] = useState<WidgetConfig | null>(null);
  const [open, setOpen] = useState(options.autoOpen);

  const loadConfig = useCallback(async () => {
    try {
      setConfig(await client.getConfig());
    } catch {
      // config is optional: fall back to local defaults
    }
  }, [client]);

  useEffect(() => {
    void loadConfig();
  }, [loadConfig]);

  useEffect(() => {
    if (open) void loadConfig();
  }, [open, loadConfig]);

  const locale: Locale = useMemo(
    () => resolveLocale([options.locale, config?.default_locale]),
    [options.locale, config?.default_locale],
  );
  const t = useMemo(() => createTranslator(locale), [locale]);
  const chat = useChat(client, visitor, locale);
  const title = options.title ?? config?.workspace_name ?? t("title");
  const welcome = options.welcome ?? t("welcome");

  function startNewConversation() {
    chat.reset();
    void loadConfig();
  }

  return (
    <div class={`erc-root erc-root--${options.position}`}>
      {open ? (
        <Panel
          title={title}
          welcome={welcome}
          t={t}
          chat={chat}
          onNewConversation={startNewConversation}
          onClose={() => setOpen(false)}
        />
      ) : null}
      <Launcher
        open={open}
        label={t(open ? "close" : "launcherLabel")}
        onClick={() => setOpen((value) => !value)}
      />
    </div>
  );
}
