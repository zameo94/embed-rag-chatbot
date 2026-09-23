import {
  createTranslator,
  errorMessageKey,
  normalizeLocale,
  resolveLocale,
  translate,
} from "./index";

describe("i18n", () => {
  it("normalizes supported locales and their regional variants", () => {
    expect(normalizeLocale("it")).toBe("it");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("EN")).toBe("en");
    expect(normalizeLocale("fr")).toBeNull();
    expect(normalizeLocale(undefined)).toBeNull();
    expect(normalizeLocale("")).toBeNull();
  });

  it("resolves the first supported candidate, falling back to english", () => {
    expect(resolveLocale([undefined, "en-GB", "it"])).toBe("en");
    expect(resolveLocale(["it", "en"])).toBe("it");
    expect(resolveLocale(["fr", "de"])).toBe("en");
    expect(resolveLocale([])).toBe("en");
  });

  it("translates and builds a translator", () => {
    expect(translate("en", "send")).toBe("Send");
    expect(createTranslator("it")("send")).toBe("Invia");
  });

  it("maps error codes to message keys", () => {
    expect(errorMessageKey("RATE_LIMITED")).toBe("errorRateLimited");
    expect(errorMessageKey("LLM_UNAVAILABLE")).toBe("errorUnavailable");
    expect(errorMessageKey("NETWORK_ERROR")).toBe("errorNetwork");
    expect(errorMessageKey("SOMETHING_ELSE")).toBe("errorGeneric");
  });
});
