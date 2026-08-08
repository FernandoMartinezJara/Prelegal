import { describe, expect, it } from "vitest";
import { render } from "@testing-library/react";
import { RichText } from "./RichText";

describe("RichText", () => {
  it("renders bold segments as <strong> and plain segments as plain text", () => {
    const { container } = render(
      <RichText
        segments={[
          { text: "Heading", bold: true },
          { text: ". Body text.", bold: false },
        ]}
      />
    );
    const strong = container.querySelector("strong");
    expect(strong).not.toBeNull();
    expect(strong).toHaveTextContent("Heading");
    expect(container).toHaveTextContent("Heading. Body text.");
  });

  it("renders nothing for an empty segment list", () => {
    const { container } = render(<RichText segments={[]} />);
    expect(container.textContent).toBe("");
  });
});
