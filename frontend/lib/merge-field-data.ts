import type { FieldData } from "./field-data";

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function mergeValue(current: unknown, sent: unknown, assistant: unknown): unknown {
  if (isPlainObject(current) && isPlainObject(sent) && isPlainObject(assistant)) {
    const merged: Record<string, unknown> = {};
    for (const key of Object.keys(sent)) {
      merged[key] = mergeValue(current[key], sent[key], assistant[key]);
    }
    return merged;
  }
  return assistant === sent ? current : assistant;
}

/**
 * Applies only the fields the assistant actually changed (relative to the
 * snapshot that was sent to it) on top of the latest known state, so an
 * inline preview edit made while a chat request is in flight isn't clobbered
 * by the assistant's now-stale echo of the fields it wasn't asked about.
 * Works for any document type's field shape since it walks both objects
 * structurally instead of naming fields.
 */
export function mergeAssistantUpdate(current: FieldData, sent: FieldData, assistant: FieldData): FieldData {
  const merged: FieldData = {};
  for (const key of Object.keys(sent)) {
    merged[key] = mergeValue(current[key], sent[key], assistant[key]) as FieldData[string];
  }
  return merged;
}
