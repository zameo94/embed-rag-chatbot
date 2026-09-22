import { en } from "./en";
import { it } from "./it";

export type Locale = "it" | "en";
export type MessageKey = keyof typeof it;
export type Translator = (key: MessageKey) => string;

const dictionaries: Record<Locale, Record<MessageKey, string>> = { it, en };
const SUPPORTED: readonly Locale[] = ["it", "en"];

const ERROR_KEYS: Record<string, MessageKey> = {
  LLM_UNAVAILABLE: "errorUnavailable",
  LLM_HTTP_ERROR: "errorUnavailable",
  STREAM_INTERNAL_ERROR: "errorGeneric",
  RATE_LIMITED: "errorRateLimited",
  NETWORK_ERROR: "errorNetwork",
  STREAM_INCOMPLETE: "errorStreamIncomplete",
};

export function normalizeLocale(value: string | null | undefined): Locale | null {
  if (!value) return null;
  const base = value.toLowerCase().split("-")[0];
  return SUPPORTED.includes(base as Locale) ? (base as Locale) : null;
}

export function resolveLocale(candidates: (string | null | undefined)[]): Locale {
  for (const candidate of candidates) {
    const locale = normalizeLocale(candidate);
    if (locale) return locale;
  }
  return "it";
}

export function translate(locale: Locale, key: MessageKey): string {
  return dictionaries[locale][key] ?? dictionaries.it[key];
}

export function createTranslator(locale: Locale): Translator {
  return (key) => translate(locale, key);
}

export function errorMessageKey(code: string): MessageKey {
  return ERROR_KEYS[code] ?? "errorGeneric";
}
