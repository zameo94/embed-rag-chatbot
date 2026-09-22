export type WidgetPosition = "bottom-right" | "bottom-left";

export interface WidgetOptions {
  embedKey: string;
  apiUrl: string;
  locale?: string;
  title?: string;
  welcome?: string;
  primaryColor?: string;
  position: WidgetPosition;
  autoOpen: boolean;
}

function parsePosition(value: string | undefined): WidgetPosition {
  return value === "bottom-left" ? "bottom-left" : "bottom-right";
}

function optional(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function parseOptions(element: HTMLElement): WidgetOptions {
  const data = element.dataset;
  return {
    embedKey: data.embedKey?.trim() ?? "",
    apiUrl: data.apiUrl?.trim() ?? "",
    locale: optional(data.locale),
    title: optional(data.title),
    welcome: optional(data.welcome),
    primaryColor: optional(data.primaryColor),
    position: parsePosition(data.position),
    autoOpen: data.autoOpen === "true",
  };
}

export function isConfigured(options: WidgetOptions): boolean {
  return options.embedKey !== "" && options.apiUrl !== "";
}
