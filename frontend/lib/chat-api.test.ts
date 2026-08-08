import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatApiError, sendChatMessage } from "./chat-api";
import { createDefaultNdaFormData } from "./nda-data";

describe("sendChatMessage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("posts messages and ndaData, and returns the parsed result", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ reply: "Got it", ndaData: createDefaultNdaFormData() }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const messages = [{ role: "user" as const, content: "hi" }];
    const ndaData = createDefaultNdaFormData();
    const result = await sendChatMessage(messages, ndaData);

    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ messages, ndaData }),
      })
    );
    expect(result.reply).toBe("Got it");
  });

  it("throws ChatApiError when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    await expect(
      sendChatMessage([{ role: "user", content: "hi" }], createDefaultNdaFormData())
    ).rejects.toThrow(ChatApiError);
  });

  it("throws ChatApiError when fetch itself fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down"))
    );

    await expect(
      sendChatMessage([{ role: "user", content: "hi" }], createDefaultNdaFormData())
    ).rejects.toThrow(ChatApiError);
  });
});
