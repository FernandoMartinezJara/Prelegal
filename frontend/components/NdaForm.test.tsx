import { useState } from "react";
import { describe, expect, it } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { NdaForm } from "./NdaForm";
import { createDefaultNdaFormData } from "@/lib/nda-data";

function ControlledNdaForm() {
  const [data, setData] = useState(createDefaultNdaFormData);
  return <NdaForm data={data} onChange={setData} />;
}

describe("NdaForm", () => {
  it("renders the default purpose text", () => {
    render(<ControlledNdaForm />);
    expect(screen.getByLabelText("Purpose")).toHaveValue(
      "Evaluating whether to enter into a business relationship with the other party."
    );
  });

  it("updates the purpose as the user types", async () => {
    render(<ControlledNdaForm />);
    const purpose = screen.getByLabelText("Purpose");
    await userEvent.clear(purpose);
    await userEvent.type(purpose, "Exploring a partnership");
    expect(purpose).toHaveValue("Exploring a partnership");
  });

  it("updates the effective date", () => {
    render(<ControlledNdaForm />);
    fireEvent.change(screen.getByLabelText("Effective date"), {
      target: { value: "2026-01-15" },
    });
    expect(screen.getByLabelText("Effective date")).toHaveValue("2026-01-15");
  });

  it("updates governing law and jurisdiction independently", async () => {
    render(<ControlledNdaForm />);
    await userEvent.type(screen.getByLabelText("Governing law (state)"), "Delaware");
    await userEvent.type(
      screen.getByLabelText("Jurisdiction (city/county and state)"),
      "New Castle"
    );
    expect(screen.getByLabelText("Governing law (state)")).toHaveValue("Delaware");
    expect(screen.getByLabelText("Jurisdiction (city/county and state)")).toHaveValue(
      "New Castle"
    );
  });

  it("updates the optional modifications field", async () => {
    render(<ControlledNdaForm />);
    await userEvent.type(
      screen.getByLabelText("MNDA modifications (optional)"),
      "No modifications."
    );
    expect(screen.getByLabelText("MNDA modifications (optional)")).toHaveValue(
      "No modifications."
    );
  });

  it("updates party 1 and party 2 independently", async () => {
    render(<ControlledNdaForm />);
    const nameInputs = screen.getAllByLabelText("Print name");
    expect(nameInputs).toHaveLength(2);
    await userEvent.type(nameInputs[0], "Alice");
    await userEvent.type(nameInputs[1], "Bob");
    expect(nameInputs[0]).toHaveValue("Alice");
    expect(nameInputs[1]).toHaveValue("Bob");
  });

  it("toggles the MNDA term without affecting the confidentiality term", () => {
    render(<ControlledNdaForm />);
    fireEvent.click(
      screen.getByLabelText("Continues until terminated in accordance with the terms of the MNDA")
    );
    expect(
      screen.getByLabelText(
        "Continues until terminated in accordance with the terms of the MNDA"
      )
    ).toBeChecked();
    // Term of confidentiality's "Expires" radio should remain checked.
    const expiresRadios = screen.getAllByLabelText("Expires");
    expect(expiresRadios[1]).toBeChecked();
  });

  it("toggles the confidentiality term without affecting the MNDA term", () => {
    render(<ControlledNdaForm />);
    fireEvent.click(screen.getByLabelText("In perpetuity"));
    expect(screen.getByLabelText("In perpetuity")).toBeChecked();
    const expiresRadios = screen.getAllByLabelText("Expires");
    expect(expiresRadios[0]).toBeChecked();
  });

  it("prevents the native form submission", () => {
    render(<ControlledNdaForm />);
    const form = document.querySelector("form")!;
    const submitEvent = new Event("submit", { bubbles: true, cancelable: true });
    form.dispatchEvent(submitEvent);
    expect(submitEvent.defaultPrevented).toBe(true);
  });
});
