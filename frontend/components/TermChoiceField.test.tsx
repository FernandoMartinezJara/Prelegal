import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { TermChoiceField } from "./TermChoiceField";

const baseProps = {
  legend: "MNDA term",
  name: "mndaTerm",
  fixedLabel: "Expires",
  openEndedLabel: "Continues until terminated",
};

describe("TermChoiceField", () => {
  it("checks the fixed radio and enables the year input when type is fixed", () => {
    render(
      <TermChoiceField {...baseProps} value={{ type: "fixed", years: 2 }} onChange={vi.fn()} />
    );
    expect(screen.getByLabelText("Expires")).toBeChecked();
    expect(screen.getByLabelText("Continues until terminated")).not.toBeChecked();
    expect(screen.getByLabelText("Number of years")).toBeEnabled();
    expect(screen.getByLabelText("Number of years")).toHaveValue(2);
  });

  it("checks the open-ended radio and disables the year input when type is open-ended", () => {
    render(
      <TermChoiceField
        {...baseProps}
        value={{ type: "open-ended", years: 2 }}
        onChange={vi.fn()}
      />
    );
    expect(screen.getByLabelText("Continues until terminated")).toBeChecked();
    expect(screen.getByLabelText("Number of years")).toBeDisabled();
  });

  it("switches to open-ended without changing the stored year count", () => {
    const onChange = vi.fn();
    render(
      <TermChoiceField {...baseProps} value={{ type: "fixed", years: 2 }} onChange={onChange} />
    );
    fireEvent.click(screen.getByLabelText("Continues until terminated"));
    expect(onChange).toHaveBeenCalledWith({ type: "open-ended", years: 2 });
  });

  it("switches back to fixed", () => {
    const onChange = vi.fn();
    render(
      <TermChoiceField
        {...baseProps}
        value={{ type: "open-ended", years: 2 }}
        onChange={onChange}
      />
    );
    fireEvent.click(screen.getByLabelText("Expires"));
    expect(onChange).toHaveBeenCalledWith({ type: "fixed", years: 2 });
  });

  it("updates the year count when a valid number is entered", () => {
    const onChange = vi.fn();
    render(
      <TermChoiceField {...baseProps} value={{ type: "fixed", years: 1 }} onChange={onChange} />
    );
    fireEvent.change(screen.getByLabelText("Number of years"), { target: { value: "5" } });
    expect(onChange).toHaveBeenCalledWith({ type: "fixed", years: 5 });
  });

  it("falls back to 1 year when the number field is cleared", () => {
    const onChange = vi.fn();
    render(
      <TermChoiceField {...baseProps} value={{ type: "fixed", years: 1 }} onChange={onChange} />
    );
    fireEvent.change(screen.getByLabelText("Number of years"), { target: { value: "" } });
    expect(onChange).toHaveBeenCalledWith({ type: "fixed", years: 1 });
  });
});
