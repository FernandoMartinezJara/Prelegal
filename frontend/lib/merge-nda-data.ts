import type { NdaFormData, PartyDetails, TermChoice } from "./nda-data";

function mergeScalar<T>(current: T, sent: T, assistant: T): T {
  return assistant === sent ? current : assistant;
}

function mergeTerm(
  current: { type: TermChoice; years: number },
  sent: { type: TermChoice; years: number },
  assistant: { type: TermChoice; years: number }
) {
  return {
    type: mergeScalar(current.type, sent.type, assistant.type),
    years: mergeScalar(current.years, sent.years, assistant.years),
  };
}

function mergeParty(current: PartyDetails, sent: PartyDetails, assistant: PartyDetails): PartyDetails {
  return {
    name: mergeScalar(current.name, sent.name, assistant.name),
    title: mergeScalar(current.title, sent.title, assistant.title),
    company: mergeScalar(current.company, sent.company, assistant.company),
    noticeAddress: mergeScalar(current.noticeAddress, sent.noticeAddress, assistant.noticeAddress),
    date: mergeScalar(current.date, sent.date, assistant.date),
  };
}

/**
 * Applies only the fields the assistant actually changed (relative to the
 * snapshot that was sent to it) on top of the latest known state, so an
 * inline preview edit made while a chat request is in flight isn't clobbered
 * by the assistant's now-stale echo of the fields it wasn't asked about.
 */
export function mergeAssistantUpdate(
  current: NdaFormData,
  sent: NdaFormData,
  assistant: NdaFormData
): NdaFormData {
  return {
    purpose: mergeScalar(current.purpose, sent.purpose, assistant.purpose),
    effectiveDate: mergeScalar(current.effectiveDate, sent.effectiveDate, assistant.effectiveDate),
    mndaTerm: mergeTerm(current.mndaTerm, sent.mndaTerm, assistant.mndaTerm),
    confidentialityTerm: mergeTerm(
      current.confidentialityTerm,
      sent.confidentialityTerm,
      assistant.confidentialityTerm
    ),
    governingLaw: mergeScalar(current.governingLaw, sent.governingLaw, assistant.governingLaw),
    jurisdiction: mergeScalar(current.jurisdiction, sent.jurisdiction, assistant.jurisdiction),
    modifications: mergeScalar(current.modifications, sent.modifications, assistant.modifications),
    party1: mergeParty(current.party1, sent.party1, assistant.party1),
    party2: mergeParty(current.party2, sent.party2, assistant.party2),
  };
}
