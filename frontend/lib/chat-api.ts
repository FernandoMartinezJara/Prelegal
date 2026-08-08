import type { NdaFormData } from "./nda-data";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ChatTurnResult {
  reply: string;
  ndaData: NdaFormData;
}

export class ChatApiError extends Error {}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function sendChatMessage(
  messages: ChatMessage[],
  ndaData: NdaFormData
): Promise<ChatTurnResult> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, ndaData }),
    });
  } catch {
    throw new ChatApiError("Could not reach the server. Check your connection and try again.");
  }

  if (!response.ok) {
    throw new ChatApiError("The assistant is temporarily unavailable. Please try again.");
  }

  return (await response.json()) as ChatTurnResult;
}
