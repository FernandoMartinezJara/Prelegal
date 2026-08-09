import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatPanel } from "./ChatPanel";
import { sendChatMessage } from "@/lib/chat-api";
import type { FieldData } from "@/lib/field-data";

vi.mock("@/lib/chat-api", () => ({
  sendChatMessage: vi.fn(),
}));

const FIELD_DATA: FieldData = { purpose: "" };

describe("ChatPanel", () => {
  beforeEach(() => {
    vi.mocked(sendChatMessage).mockReset();
  });

  it("shows a greeting on load", () => {
    render(
      <ChatPanel
        documentType={null}
        fieldData={{}}
        onDocumentTypeChange={vi.fn()}
        onFieldDataChange={vi.fn()}
      />
    );
    expect(screen.getByText(/What kind of legal document/)).toBeInTheDocument();
  });

  it("sends a message, shows the reply, and merges the returned field data when the type is unchanged", async () => {
    vi.mocked(sendChatMessage).mockResolvedValue({
      reply: "Got it!",
      documentType: "mutual-nda",
      fieldData: { ...FIELD_DATA, purpose: "Evaluating a partnership" },
    });
    const onFieldDataChange = vi.fn();
    const onDocumentTypeChange = vi.fn();

    render(
      <ChatPanel
        documentType="mutual-nda"
        fieldData={FIELD_DATA}
        onDocumentTypeChange={onDocumentTypeChange}
        onFieldDataChange={onFieldDataChange}
      />
    );
    await userEvent.type(screen.getByLabelText("Message"), "It's for a partnership");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Got it!")).toBeInTheDocument();
    expect(screen.getByText("It's for a partnership")).toBeInTheDocument();
    expect(onDocumentTypeChange).not.toHaveBeenCalled();
    expect(onFieldDataChange).toHaveBeenCalledTimes(1);
    const updater = onFieldDataChange.mock.calls[0][0];
    expect(updater(FIELD_DATA)).toEqual({ purpose: "Evaluating a partnership" });
    expect(sendChatMessage).toHaveBeenCalledWith(
      [
        expect.objectContaining({ role: "assistant" }),
        { role: "user", content: "It's for a partnership" },
      ],
      "mutual-nda",
      FIELD_DATA
    );
  });

  it("reports a document type resolution instead of merging when the type changes", async () => {
    vi.mocked(sendChatMessage).mockResolvedValue({
      reply: "Sounds like a Pilot Agreement!",
      documentType: "pilot-agreement",
      fieldData: { effective_date: "" },
    });
    const onFieldDataChange = vi.fn();
    const onDocumentTypeChange = vi.fn();

    render(
      <ChatPanel
        documentType={null}
        fieldData={{}}
        onDocumentTypeChange={onDocumentTypeChange}
        onFieldDataChange={onFieldDataChange}
      />
    );
    await userEvent.type(screen.getByLabelText("Message"), "I want a pilot agreement");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Sounds like a Pilot Agreement!")).toBeInTheDocument();
    expect(onFieldDataChange).not.toHaveBeenCalled();
    expect(onDocumentTypeChange).toHaveBeenCalledWith("pilot-agreement", { effective_date: "" });
  });

  it("returns focus to the message box after a turn completes", async () => {
    vi.mocked(sendChatMessage).mockResolvedValue({
      reply: "Got it!",
      documentType: "mutual-nda",
      fieldData: FIELD_DATA,
    });

    render(
      <ChatPanel
        documentType="mutual-nda"
        fieldData={FIELD_DATA}
        onDocumentTypeChange={vi.fn()}
        onFieldDataChange={vi.fn()}
      />
    );
    const textarea = screen.getByLabelText("Message");
    await userEvent.type(textarea, "hello");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Got it!")).toBeInTheDocument();
    expect(textarea).toHaveFocus();
  });

  it("sends on Enter but inserts a newline on Shift+Enter", async () => {
    vi.mocked(sendChatMessage).mockResolvedValue({
      reply: "Got it!",
      documentType: "mutual-nda",
      fieldData: FIELD_DATA,
    });

    render(
      <ChatPanel
        documentType="mutual-nda"
        fieldData={FIELD_DATA}
        onDocumentTypeChange={vi.fn()}
        onFieldDataChange={vi.fn()}
      />
    );
    const textarea = screen.getByLabelText("Message");
    await userEvent.type(textarea, "line one{Shift>}{enter}{/Shift}line two");
    expect(textarea).toHaveValue("line one\nline two");

    await userEvent.type(textarea, "{enter}");

    expect(await screen.findByText("Got it!")).toBeInTheDocument();
    expect(sendChatMessage).toHaveBeenCalledWith(
      [
        expect.objectContaining({ role: "assistant" }),
        { role: "user", content: "line one\nline two" },
      ],
      "mutual-nda",
      FIELD_DATA
    );
  });

  it("shows a retry option when the request fails, and retries without duplicating the message", async () => {
    vi.mocked(sendChatMessage).mockRejectedValueOnce(new Error("network down"));
    vi.mocked(sendChatMessage).mockResolvedValueOnce({
      reply: "Got it!",
      documentType: "mutual-nda",
      fieldData: FIELD_DATA,
    });

    render(
      <ChatPanel
        documentType="mutual-nda"
        fieldData={FIELD_DATA}
        onDocumentTypeChange={vi.fn()}
        onFieldDataChange={vi.fn()}
      />
    );
    await userEvent.type(screen.getByLabelText("Message"), "hello");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(
      await screen.findByText("Something went wrong reaching the assistant. Please try again.")
    ).toBeInTheDocument();
    expect(screen.getAllByText("hello")).toHaveLength(1);

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));

    expect(await screen.findByText("Got it!")).toBeInTheDocument();
    expect(screen.getAllByText("hello")).toHaveLength(1);
    expect(sendChatMessage).toHaveBeenCalledTimes(2);
  });
});
