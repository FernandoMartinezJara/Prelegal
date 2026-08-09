import type { FieldData } from "./field-data";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatTurnResult {
  reply: string;
  documentType: string | null;
  fieldData: FieldData;
}

export class ChatApiError extends Error {}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function sendChatMessage(
  messages: ChatMessage[],
  documentType: string | null,
  fieldData: FieldData
): Promise<ChatTurnResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, documentType, fieldData }),
    });
  } catch {
    throw new ChatApiError("Could not reach the server. Check your connection and try again.");
  }

  if (!response.ok) {
    throw new ChatApiError("The assistant is temporarily unavailable. Please try again.");
  }

  return (await response.json()) as ChatTurnResult;
}
