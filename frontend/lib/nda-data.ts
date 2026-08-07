export type TermChoice = "fixed" | "open-ended";

export interface PartyDetails {
  name: string;
  title: string;
  company: string;
  noticeAddress: string;
  date: string;
}

export interface NdaFormData {
  purpose: string;
  effectiveDate: string;
  mndaTerm: {
    type: TermChoice;
    years: number;
  };
  confidentialityTerm: {
    type: TermChoice;
    years: number;
  };
  governingLaw: string;
  jurisdiction: string;
  modifications: string;
  party1: PartyDetails;
  party2: PartyDetails;
}

function emptyParty(): PartyDetails {
  return { name: "", title: "", company: "", noticeAddress: "", date: "" };
}

export function createDefaultNdaFormData(): NdaFormData {
  return {
    purpose: "Evaluating whether to enter into a business relationship with the other party.",
    effectiveDate: "",
    mndaTerm: { type: "fixed", years: 1 },
    confidentialityTerm: { type: "fixed", years: 1 },
    governingLaw: "",
    jurisdiction: "",
    modifications: "",
    party1: emptyParty(),
    party2: emptyParty(),
  };
}
