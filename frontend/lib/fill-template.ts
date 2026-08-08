import { NDA_CLAUSES } from "./nda-template";
import type { NdaFormData, TermChoice } from "./nda-data";

export interface RichSegment {
  text: string;
  bold: boolean;
}

export interface FilledClause {
  number: number;
  segments: RichSegment[];
}

export function describeMndaTerm(type: TermChoice, years: number): string {
  return type === "fixed"
    ? `${years} year(s) from the Effective Date`
    : `the date this MNDA is terminated in accordance with its terms`;
}

export function describeConfidentialityTerm(type: TermChoice, years: number): string {
  return type === "fixed"
    ? `${years} year(s) from the Effective Date, but in the case of trade secrets until the Confidential Information is no longer considered a trade secret under applicable law`
    : `in perpetuity`;
}

// Free-text form fields are substituted into a template that also uses `**`
// to mark up bold headings, so a literal `**` typed by a user (e.g. pasted
// from another document) must not be allowed to alter the bold segmentation.
function sanitizeFreeText(value: string): string {
  return value.replace(/\*/g, "");
}

function buildTokenValues(data: NdaFormData): Record<string, string> {
  return {
    purpose: sanitizeFreeText(data.purpose) || "[Purpose not provided]",
    effectiveDate: data.effectiveDate || "[Effective Date not provided]",
    mndaTerm: describeMndaTerm(data.mndaTerm.type, data.mndaTerm.years),
    termOfConfidentiality: describeConfidentialityTerm(
      data.confidentialityTerm.type,
      data.confidentialityTerm.years
    ),
    governingLaw: sanitizeFreeText(data.governingLaw) || "[Governing Law not provided]",
    jurisdiction: sanitizeFreeText(data.jurisdiction) || "[Jurisdiction not provided]",
  };
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

export function fillNdaClauses(data: NdaFormData): FilledClause[] {
  const tokenValues = buildTokenValues(data);
  return NDA_CLAUSES.map((clause) => ({
    number: clause.number,
    segments: fillAndSegment(clause.text, tokenValues),
  }));
}
