import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PartyFieldset } from "./PartyFieldset";
import type { PartyDetails } from "@/lib/nda-data";

function sampleParty(): PartyDetails {
  return {
    name: "Alice Smith",
    title: "CEO",
    company: "Acme Inc.",
    noticeAddress: "alice@acme.test",
    date: "2026-01-01",
  };
}

describe("PartyFieldset", () => {
  it("shows the legend and each field's current value", () => {
    render(<PartyFieldset legend="Party 1" party={sampleParty()} onChange={vi.fn()} />);
    expect(screen.getByText("Party 1")).toBeInTheDocument();
    expect(screen.getByLabelText("Print name")).toHaveValue("Alice Smith");
    expect(screen.getByLabelText("Title")).toHaveValue("CEO");
    expect(screen.getByLabelText("Company")).toHaveValue("Acme Inc.");
    expect(screen.getByLabelText("Notice address (email or postal)")).toHaveValue(
      "alice@acme.test"
    );
    expect(screen.getByLabelText("Date")).toHaveValue("2026-01-01");
  });

  it("reports a name change as a partial patch", async () => {
    const onChange = vi.fn();
    render(<PartyFieldset legend="Party 1" party={sampleParty()} onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Print name"), "!");
    expect(onChange).toHaveBeenCalledWith({ name: "Alice Smith!" });
  });

  it("reports a company change as a partial patch", async () => {
    const onChange = vi.fn();
    render(<PartyFieldset legend="Party 1" party={sampleParty()} onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Company"), "!");
    expect(onChange).toHaveBeenCalledWith({ company: "Acme Inc.!" });
  });

  it("reports a title change as a partial patch", async () => {
    const onChange = vi.fn();
    render(<PartyFieldset legend="Party 1" party={sampleParty()} onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Title"), "!");
    expect(onChange).toHaveBeenCalledWith({ title: "CEO!" });
  });

  it("reports a notice address change as a partial patch", async () => {
    const onChange = vi.fn();
    render(<PartyFieldset legend="Party 1" party={sampleParty()} onChange={onChange} />);
    await userEvent.type(screen.getByLabelText("Notice address (email or postal)"), "!");
    expect(onChange).toHaveBeenCalledWith({ noticeAddress: "alice@acme.test!" });
  });

  it("reports a date change as a partial patch", () => {
    const onChange = vi.fn();
    render(<PartyFieldset legend="Party 1" party={sampleParty()} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText("Date"), { target: { value: "2027-05-06" } });
    expect(onChange).toHaveBeenCalledWith({ date: "2027-05-06" });
  });
});
