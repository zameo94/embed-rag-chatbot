import type { WidgetOptions } from "./config";

export const DEFAULT_PRIMARY_COLOR = "#2563eb";

export function themeVariables(options: WidgetOptions): Record<string, string> {
  return {
    "--erc-primary": options.primaryColor ?? DEFAULT_PRIMARY_COLOR,
  };
}
