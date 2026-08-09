import type { DocumentTypeDetail } from "./document-schema";

export type TermChoice = "fixed" | "open-ended";

export interface TermValue {
  type: TermChoice;
  years: number;
}

export interface PartyDetails {
  name: string;
  title: string;
  company: string;
  notice_address: string;
  date: string;
}

export type FieldValue = string | TermValue;

// Keys are whatever `FieldSchema.key`/party index the backend defines for the
// active document type (e.g. "effective_date", "party1") — snake_case,
// matching the backend's wire format exactly so no case-conversion is ever
// needed when reading or writing this object.
export type FieldData = Record<string, FieldValue | PartyDetails>;

export function createDefaultPartyDetails(): PartyDetails {
  return { name: "", title: "", company: "", notice_address: "", date: "" };
}

export function createDefaultFieldData(schema: DocumentTypeDetail): FieldData {
  const data: FieldData = {};
  for (const field of schema.fields) {
    // years: 0 means "not yet specified" for a fixed term — matches the
    // backend's TermLength default so a required term field can actually be
    // detected as missing until the user (or the assistant) sets a real value.
    data[field.key] = field.kind === "term" ? { type: "fixed", years: 0 } : "";
  }
  schema.partyRoles.forEach((_, index) => {
    data[`party${index + 1}`] = createDefaultPartyDetails();
  });
  return data;
}
