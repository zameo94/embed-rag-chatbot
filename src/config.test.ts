import { isConfigured, parseOptions } from "./config";

function element(attributes: Record<string, string> = {}): HTMLElement {
  const node = document.createElement("div");
  for (const [key, value] of Object.entries(attributes)) {
    node.dataset[key] = value;
  }
  return node;
}

describe("parseOptions", () => {
  it("reads every data attribute", () => {
    const options = parseOptions(
      element({
        embedKey: "pk_1",
        apiUrl: "https://api.example.com",
        locale: "en",
        title: "Support",
        welcome: "Hi",
        primaryColor: "#000000",
        position: "bottom-left",
        autoOpen: "true",
      }),
    );

    expect(options).toEqual({
      embedKey: "pk_1",
      apiUrl: "https://api.example.com",
      locale: "en",
      title: "Support",
      welcome: "Hi",
      primaryColor: "#000000",
      position: "bottom-left",
      autoOpen: true,
    });
  });

  it("applies defaults and trims blank optional values", () => {
    const options = parseOptions(
      element({ embedKey: " pk_1 ", apiUrl: " https://api ", title: "   " }),
    );

    expect(options.embedKey).toBe("pk_1");
    expect(options.apiUrl).toBe("https://api");
    expect(options.title).toBeUndefined();
    expect(options.position).toBe("bottom-right");
    expect(options.autoOpen).toBe(false);
  });

  it("detects whether the widget is configured", () => {
    expect(isConfigured(parseOptions(element({ embedKey: "k", apiUrl: "u" })))).toBe(
      true,
    );
    expect(isConfigured(parseOptions(element({ embedKey: "k" })))).toBe(false);
    expect(isConfigured(parseOptions(element()))).toBe(false);
  });
});
