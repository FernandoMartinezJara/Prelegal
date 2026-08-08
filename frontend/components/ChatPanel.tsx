"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import type { NdaFormData } from "@/lib/nda-data";
import { sendChatMessage, type ChatMessage } from "@/lib/chat-api";
import { mergeAssistantUpdate } from "@/lib/merge-nda-data";

const GREETING: ChatMessage = {
  role: "assistant",
  content:
    "Hi! Let's put together your Mutual NDA. What's the purpose of the two parties sharing confidential information?",
};

interface ChatPanelProps {
  ndaData: NdaFormData;
  onNdaDataChange: Dispatch<SetStateAction<NdaFormData>>;
}

export function ChatPanel({ ndaData, onNdaDataChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([GREETING]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRetry, setPendingRetry] = useState<ChatMessage[] | null>(null);

  async function handleSubmit(pendingMessages?: ChatMessage[]) {
    const outgoingMessages = pendingMessages ?? [...messages, { role: "user", content: input }];
    if (!pendingMessages) {
      if (!input.trim() || isSending) return;
      setMessages(outgoingMessages);
      setInput("");
    }
    setIsSending(true);
    setError(null);
    const sentNdaData = ndaData;

    try {
      const result = await sendChatMessage(outgoingMessages, sentNdaData);
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
      onNdaDataChange((current) => mergeAssistantUpdate(current, sentNdaData, result.ndaData));
    } catch {
      setError("Something went wrong reaching the assistant. Please try again.");
      setPendingRetry(outgoingMessages);
    } finally {
      setIsSending(false);
    }
  }

  function retry() {
    if (!pendingRetry) return;
    setPendingRetry(null);
    handleSubmit(pendingRetry);
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div
        aria-live="polite"
        className="flex max-h-[60vh] min-h-[300px] flex-col gap-2 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3"
      >
        {messages.map((message, index) => (
          <div
            key={index}
            className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
              message.role === "user"
                ? "self-end bg-[#209dd7] text-white"
                : "self-start bg-white text-[#032147] shadow-sm"
            }`}
          >
            {message.content}
          </div>
        ))}
        {isSending && <p className="text-xs text-[#888888]">Assistant is thinking…</p>}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={retry} className="font-medium underline">
            Retry
          </button>
        </div>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
      >
        <textarea
          aria-label="Message"
          className="flex-1 resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          rows={2}
          value={input}
          disabled={isSending}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
        />
        <button
          type="submit"
          disabled={isSending || !input.trim()}
          className="rounded-md bg-[#753991] px-4 py-2 text-sm font-medium text-white shadow-sm disabled:cursor-not-allowed disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
