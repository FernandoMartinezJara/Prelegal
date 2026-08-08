import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatPanel } from "./ChatPanel";
import { createDefaultNdaFormData } from "@/lib/nda-data";
import { sendChatMessage } from "@/lib/chat-api";

vi.mock("@/lib/chat-api", () => ({
  sendChatMessage: vi.fn(),
}));

describe("ChatPanel", () => {
  beforeEach(() => {
    vi.mocked(sendChatMessage).mockReset();
  });

  it("shows a greeting on load", () => {
    render(<ChatPanel ndaData={createDefaultNdaFormData()} onNdaDataChange={vi.fn()} />);
    expect(screen.getByText(/Let's put together your Mutual NDA/)).toBeInTheDocument();
  });

  it("sends a message, shows the reply, and updates the NDA data", async () => {
    const ndaData = createDefaultNdaFormData();
    const updated = { ...ndaData, purpose: "Evaluating a partnership" };
    vi.mocked(sendChatMessage).mockResolvedValue({ reply: "Got it!", ndaData: updated });
    const onNdaDataChange = vi.fn();

    render(<ChatPanel ndaData={ndaData} onNdaDataChange={onNdaDataChange} />);
    await userEvent.type(screen.getByLabelText("Message"), "It's for a partnership");
    await userEvent.click(screen.getByRole("button", { name: "Send" }));

    expect(await screen.findByText("Got it!")).toBeInTheDocument();
    expect(screen.getByText("It's for a partnership")).toBeInTheDocument();
    expect(onNdaDataChange).toHaveBeenCalledTimes(1);
    const updater = onNdaDataChange.mock.calls[0][0];
    expect(updater(ndaData)).toEqual(updated);
    expect(sendChatMessage).toHaveBeenCalledWith(
      [
        expect.objectContaining({ role: "assistant" }),
        { role: "user", content: "It's for a partnership" },
      ],
      ndaData
    );
  });

  it("sends on Enter but inserts a newline on Shift+Enter", async () => {
    const ndaData = createDefaultNdaFormData();
    vi.mocked(sendChatMessage).mockResolvedValue({ reply: "Got it!", ndaData });

    render(<ChatPanel ndaData={ndaData} onNdaDataChange={vi.fn()} />);
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
      ndaData
    );
  });

  it("shows a retry option when the request fails, and retries without duplicating the message", async () => {
    const ndaData = createDefaultNdaFormData();
    vi.mocked(sendChatMessage).mockRejectedValueOnce(new Error("network down"));
    vi.mocked(sendChatMessage).mockResolvedValueOnce({ reply: "Got it!", ndaData });

    render(<ChatPanel ndaData={ndaData} onNdaDataChange={vi.fn()} />);
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
