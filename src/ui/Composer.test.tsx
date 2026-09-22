import { fireEvent, render } from "@testing-library/preact";

import { Composer } from "./Composer";

function setup(disabled = false) {
  const onSend = vi.fn();
  const utils = render(
    <Composer
      disabled={disabled}
      placeholder="Scrivi un messaggio…"
      sendLabel="Invia"
      onSend={onSend}
    />,
  );
  return { ...utils, onSend };
}

describe("Composer", () => {
  it("does not send an empty message", () => {
    const { getByRole, onSend } = setup();

    fireEvent.submit(getByRole("button").closest("form") as HTMLFormElement);

    expect(onSend).not.toHaveBeenCalled();
  });

  it("sends the trimmed message and clears the input", () => {
    const { getByRole, onSend } = setup();
    const input = getByRole("textbox") as HTMLInputElement;

    fireEvent.input(input, { target: { value: "  hi  " } });
    fireEvent.submit(getByRole("button").closest("form") as HTMLFormElement);

    expect(onSend).toHaveBeenCalledWith("hi");
    expect(input.value).toBe("");
  });

  it("disables the send button while sending", () => {
    const { getByRole } = setup(true);

    expect(getByRole("button")).toBeDisabled();
  });
});
