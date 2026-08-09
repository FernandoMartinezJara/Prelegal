import type { DocumentTypeDetail } from "./document-schema";
import type { FieldData, TermChoice, TermValue } from "./field-data";

export interface RichSegment {
  text: string;
  bold: boolean;
}

export interface FilledClause {
  number: string;
  segments: RichSegment[];
}

export function describeTerm(type: TermChoice, years: number): string {
  if (type !== "fixed") return "Continues until terminated";
  // 0 is the "not yet specified" sentinel for a fixed term.
  return years > 0 ? `${years} year(s) from the Effective Date` : "[Term not yet specified]";
}

function isTermValue(value: unknown): value is TermValue {
  return typeof value === "object" && value !== null && "type" in value && "years" in value;
}

// Free-text form fields are substituted into a template that also uses `**`
// to mark up bold headings, so a literal `**` typed by a user (e.g. pasted
// from another document) must not be allowed to alter the bold segmentation.
function sanitizeFreeText(value: string): string {
  return value.replace(/\*/g, "");
}

function buildTokenValues(schema: DocumentTypeDetail, data: FieldData): Record<string, string> {
  const tokens: Record<string, string> = {};
  for (const field of schema.fields) {
    const value = data[field.key];
    if (field.kind === "term" && isTermValue(value)) {
      tokens[field.key] = describeTerm(value.type, value.years);
    } else if (typeof value === "string") {
      tokens[field.key] = sanitizeFreeText(value) || `[${field.label} not provided]`;
    }
  }
  return tokens;
}

/** Splits `**bold**` markers out of a template string into rich segments and
 * substitutes `{{token}}` placeholders with their filled-in values. */
function fillAndSegment(template: string, tokenValues: Record<string, string>): RichSegment[] {
  const withTokens = template.replace(/\{\{(\w+)\}\}/g, (match, token) =>
    Object.prototype.hasOwnProperty.call(tokenValues, token) ? tokenValues[token] : match
  );

  return withTokens
    .split(/(\*\*[^*]+\*\*)/g)
    .filter((chunk) => chunk.length > 0)
    .map((chunk) => {
      const boldMatch = chunk.match(/^\*\*([^*]+)\*\*$/);
      return boldMatch ? { text: boldMatch[1], bold: true } : { text: chunk, bold: false };
    });
}

export function fillDocumentClauses(schema: DocumentTypeDetail, data: FieldData): FilledClause[] {
  const tokenValues = buildTokenValues(schema, data);
  return schema.clauses.map((clause) => ({
    number: clause.number,
    segments: fillAndSegment(clause.text, tokenValues),
  }));
}
