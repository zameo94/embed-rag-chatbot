import type { WidgetOptions } from "./config";
import { DEFAULT_PRIMARY_COLOR, themeVariables } from "./theme";

const base: WidgetOptions = {
  embedKey: "k",
  apiUrl: "u",
  position: "bottom-right",
  autoOpen: false,
};

describe("themeVariables", () => {
  it("uses the default primary color", () => {
    expect(themeVariables(base)).toEqual({ "--erc-primary": DEFAULT_PRIMARY_COLOR });
  });

  it("uses the configured primary color", () => {
    expect(themeVariables({ ...base, primaryColor: "#123456" })).toEqual({
      "--erc-primary": "#123456",
    });
  });
});
