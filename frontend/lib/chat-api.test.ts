import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatApiError, sendChatMessage } from "./chat-api";
import type { FieldData } from "./field-data";

const FIELD_DATA: FieldData = { purpose: "" };

describe("sendChatMessage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts messages, documentType, and fieldData, and returns the parsed result", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ reply: "Got it", documentType: "mutual-nda", fieldData: FIELD_DATA }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const messages = [{ role: "user" as const, content: "hi" }];
    const result = await sendChatMessage(messages, "mutual-nda", FIELD_DATA);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ messages, documentType: "mutual-nda", fieldData: FIELD_DATA }),
      })
    );
    expect(result.reply).toBe("Got it");
    expect(result.documentType).toBe("mutual-nda");
  });

  it("throws ChatApiError when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    await expect(
      sendChatMessage([{ role: "user", content: "hi" }], null, {})
    ).rejects.toThrow(ChatApiError);
  });

  it("throws ChatApiError when fetch itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(
      sendChatMessage([{ role: "user", content: "hi" }], null, {})
    ).rejects.toThrow(ChatApiError);
  });
});
