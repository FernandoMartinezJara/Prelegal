import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InlineTermEditor } from "./InlineTermEditor";
import { describeMndaTerm } from "@/lib/fill-template";

const baseProps = {
  legend: "MNDA term",
  name: "mndaTerm",
  fixedLabel: "Expires",
  openEndedLabel: "Continues until terminated",
  describe: describeMndaTerm,
};

describe("InlineTermEditor", () => {
  it("shows the described value when idle", () => {
    render(
      <InlineTermEditor {...baseProps} value={{ type: "fixed", years: 2 }} onCommit={vi.fn()} />
    );
    expect(screen.getByRole("button", { name: "Edit MNDA term" })).toHaveTextContent(
      describeMndaTerm("fixed", 2)
    );
  });

  it("switches to open-ended on click", async () => {
    const onCommit = vi.fn();
    render(
      <InlineTermEditor {...baseProps} value={{ type: "fixed", years: 1 }} onCommit={onCommit} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Edit MNDA term" }));
    await userEvent.click(screen.getByLabelText("Continues until terminated"));

    expect(onCommit).toHaveBeenCalledWith({ type: "open-ended", years: 1 });
  });

  it("updates years while fixed", async () => {
    const onCommit = vi.fn();
    render(
      <InlineTermEditor {...baseProps} value={{ type: "fixed", years: 1 }} onCommit={onCommit} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Edit MNDA term" }));
    const yearsInput = screen.getByLabelText("MNDA term years");
    await userEvent.clear(yearsInput);
    await userEvent.type(yearsInput, "5");
    await userEvent.tab();

    expect(onCommit).toHaveBeenLastCalledWith({ type: "fixed", years: 5 });
  });

  it("commits years on Enter", async () => {
    const onCommit = vi.fn();
    render(
      <InlineTermEditor {...baseProps} value={{ type: "fixed", years: 1 }} onCommit={onCommit} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Edit MNDA term" }));
    const yearsInput = screen.getByLabelText("MNDA term years");
    await userEvent.clear(yearsInput);
    await userEvent.type(yearsInput, "7{enter}");

    expect(onCommit).toHaveBeenLastCalledWith({ type: "fixed", years: 7 });
  });

  it("switches back to fixed from open-ended", async () => {
    const onCommit = vi.fn();
    render(
      <InlineTermEditor
        {...baseProps}
        value={{ type: "open-ended", years: 1 }}
        onCommit={onCommit}
      />
    );

    await userEvent.click(screen.getByRole("button", { name: "Edit MNDA term" }));
    await userEvent.click(screen.getByLabelText("Expires"));

    expect(onCommit).toHaveBeenCalledWith({ type: "fixed", years: 1 });
  });

  it("keeps the typed years when switching type before the years field blurs", async () => {
    const onCommit = vi.fn();
    render(
      <InlineTermEditor {...baseProps} value={{ type: "fixed", years: 1 }} onCommit={onCommit} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Edit MNDA term" }));
    const yearsInput = screen.getByLabelText("MNDA term years");
    await userEvent.clear(yearsInput);
    await userEvent.type(yearsInput, "5");
    // Clicking the radio blurs the years input first, then fires its own
    // onChange - both onCommit calls should agree on years: 5, regardless
    // of which happens to run first.
    await userEvent.click(screen.getByLabelText("Continues until terminated"));

    expect(onCommit).toHaveBeenLastCalledWith({ type: "open-ended", years: 5 });
  });

  it("collapses back to idle when Done is clicked", async () => {
    render(
      <InlineTermEditor {...baseProps} value={{ type: "fixed", years: 1 }} onCommit={vi.fn()} />
    );

    await userEvent.click(screen.getByRole("button", { name: "Edit MNDA term" }));
    await userEvent.click(screen.getByRole("button", { name: "Done" }));

    expect(screen.getByRole("button", { name: "Edit MNDA term" })).toBeInTheDocument();
  });
});
