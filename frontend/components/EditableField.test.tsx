import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EditableField } from "./EditableField";

describe("EditableField", () => {
  it("shows the value, and the placeholder when blank", () => {
    render(<EditableField label="Purpose" value="Evaluate a deal" onCommit={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Edit Purpose" })).toHaveTextContent(
      "Evaluate a deal"
    );

    render(<EditableField label="Company" value="" onCommit={vi.fn()} />);
    expect(screen.getByRole("button", { name: "Edit Company" })).toHaveTextContent("—");
  });

  it("commits the new value on blur", async () => {
    const onCommit = vi.fn();
    render(<EditableField label="Company" value="Acme" onCommit={onCommit} />);

    await userEvent.click(screen.getByRole("button", { name: "Edit Company" }));
    const input = screen.getByLabelText("Company");
    await userEvent.clear(input);
    await userEvent.type(input, "Globex");
    await userEvent.tab();

    expect(onCommit).toHaveBeenCalledWith("Globex");
  });

  it("commits on Enter for single-line fields", async () => {
    const onCommit = vi.fn();
    render(<EditableField label="Company" value="Acme" onCommit={onCommit} />);

    await userEvent.click(screen.getByRole("button", { name: "Edit Company" }));
    await userEvent.type(screen.getByLabelText("Company"), "{enter}");

    expect(onCommit).toHaveBeenCalledWith("Acme");
  });

  it("reverts without committing on Escape", async () => {
    const onCommit = vi.fn();
    render(<EditableField label="Company" value="Acme" onCommit={onCommit} />);

    await userEvent.click(screen.getByRole("button", { name: "Edit Company" }));
    const input = screen.getByLabelText("Company");
    await userEvent.type(input, "Globex{escape}");

    expect(onCommit).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: "Edit Company" })).toHaveTextContent("Acme");
  });

  it("supports multiline fields via a textarea that commits on blur", async () => {
    const onCommit = vi.fn();
    render(<EditableField label="Purpose" value="" multiline onCommit={onCommit} />);

    await userEvent.click(screen.getByRole("button", { name: "Edit Purpose" }));
    await userEvent.type(screen.getByLabelText("Purpose"), "Evaluate a deal");
    await userEvent.tab();

    expect(onCommit).toHaveBeenCalledWith("Evaluate a deal");
  });
});
