"use client";

import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import type { FieldData } from "@/lib/field-data";
import { sendChatMessage, type ChatMessage } from "@/lib/chat-api";
import { mergeAssistantUpdate } from "@/lib/merge-field-data";
import type { UiStrings } from "@/lib/ui-strings";
import { Spinner } from "./Spinner";

interface ChatPanelProps {
  documentType: string | null;
  fieldData: FieldData;
  uiStrings: UiStrings;
  onDocumentTypeChange: (slug: string | null, fieldData: FieldData, language: string) => void;
  onFieldDataChange: Dispatch<SetStateAction<FieldData>>;
  onLanguageChange: (language: string) => void;
}

export function ChatPanel({
  documentType,
  fieldData,
  uiStrings,
  onDocumentTypeChange,
  onFieldDataChange,
  onLanguageChange,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "assistant", content: uiStrings.chatGreeting },
  ]);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingRetry, setPendingRetry] = useState<ChatMessage[] | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Restore focus to the message box after every turn (success or failure)
  // so the user can keep typing without having to click back into it.
  useEffect(() => {
    if (!isSending) inputRef.current?.focus();
  }, [isSending]);

  async function handleSubmit(pendingMessages?: ChatMessage[]) {
    const outgoingMessages = pendingMessages ?? [...messages, { role: "user", content: input }];
    if (!pendingMessages) {
      if (!input.trim() || isSending) return;
      setMessages(outgoingMessages);
      setInput("");
    }
    setIsSending(true);
    setError(null);
    const sentDocumentType = documentType;
    const sentFieldData = fieldData;

    try {
      const result = await sendChatMessage(outgoingMessages, sentDocumentType, sentFieldData);
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
      if (result.documentType !== sentDocumentType) {
        // onDocumentTypeChange is the sole schema-loading path here — calling
        // onLanguageChange too would kick off a second, independent fetch for
        // the OLD document type that could race and overwrite this one.
        onDocumentTypeChange(result.documentType, result.fieldData, result.language);
      } else {
        onLanguageChange(result.language);
        onFieldDataChange((current) => mergeAssistantUpdate(current, sentFieldData, result.fieldData));
      }
    } catch {
      setError(uiStrings.chatError);
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
        {isSending && (
          <p className="flex items-center gap-2 text-xs text-[#888888]">
            <Spinner className="h-3.5 w-3.5" />
            {uiStrings.chatThinking}
          </p>
        )}
      </div>

      {error && (
        <div className="flex items-center justify-between rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={retry} className="font-medium underline">
            {uiStrings.retry}
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
          ref={inputRef}
          aria-label={uiStrings.messageLabel}
          className="flex-1 resize-none rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          rows={2}
          value={input}
          readOnly={isSending}
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
          {uiStrings.send}
        </button>
      </form>
    </div>
  );
}
