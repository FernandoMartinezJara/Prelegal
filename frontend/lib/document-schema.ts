export type FieldKind = "text" | "multiline" | "date" | "term";

export interface FieldSchema {
  key: string;
  label: string;
  kind: FieldKind;
  required: boolean;
}

export interface ClauseSchema {
  number: string;
  text: string;
}

export interface DocumentTypeSummary {
  slug: string;
  name: string;
  description: string;
}

export interface DocumentTypeDetail extends DocumentTypeSummary {
  partyRoles: string[];
  fields: FieldSchema[];
  clauses: ClauseSchema[];
}
