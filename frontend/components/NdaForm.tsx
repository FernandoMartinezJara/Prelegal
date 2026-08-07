"use client";

import type { Dispatch, SetStateAction } from "react";
import type { NdaFormData } from "@/lib/nda-data";
import { PartyFieldset, inputClasses, labelClasses } from "./PartyFieldset";
import { TermChoiceField } from "./TermChoiceField";

interface NdaFormProps {
  data: NdaFormData;
  onChange: Dispatch<SetStateAction<NdaFormData>>;
}

export function NdaForm({ data, onChange }: NdaFormProps) {
  return (
    <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-800">Purpose &amp; Dates</h2>
        <label>
          <span className={labelClasses}>Purpose</span>
          <textarea
            className={inputClasses}
            rows={2}
            value={data.purpose}
            onChange={(e) => onChange((prev) => ({ ...prev, purpose: e.target.value }))}
          />
        </label>
        <label>
          <span className={labelClasses}>Effective date</span>
          <input
            type="date"
            className={inputClasses}
            value={data.effectiveDate}
            onChange={(e) => onChange((prev) => ({ ...prev, effectiveDate: e.target.value }))}
          />
        </label>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-800">Term</h2>
        <TermChoiceField
          legend="MNDA term"
          name="mndaTerm"
          fixedLabel="Expires"
          openEndedLabel="Continues until terminated in accordance with the terms of the MNDA"
          value={data.mndaTerm}
          onChange={(mndaTerm) => onChange((prev) => ({ ...prev, mndaTerm }))}
        />
        <TermChoiceField
          legend="Term of confidentiality"
          name="confidentialityTerm"
          fixedLabel="Expires"
          openEndedLabel="In perpetuity"
          value={data.confidentialityTerm}
          onChange={(confidentialityTerm) =>
            onChange((prev) => ({ ...prev, confidentialityTerm }))
          }
        />
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label>
          <span className={labelClasses}>Governing law (state)</span>
          <input
            className={inputClasses}
            placeholder="e.g. Delaware"
            value={data.governingLaw}
            onChange={(e) => onChange((prev) => ({ ...prev, governingLaw: e.target.value }))}
          />
        </label>
        <label>
          <span className={labelClasses}>Jurisdiction (city/county and state)</span>
          <input
            className={inputClasses}
            placeholder="e.g. courts located in New Castle, DE"
            value={data.jurisdiction}
            onChange={(e) => onChange((prev) => ({ ...prev, jurisdiction: e.target.value }))}
          />
        </label>
      </section>

      <label className="block">
        <span className={labelClasses}>MNDA modifications (optional)</span>
        <textarea
          className={inputClasses}
          rows={2}
          value={data.modifications}
          onChange={(e) => onChange((prev) => ({ ...prev, modifications: e.target.value }))}
        />
      </label>

      <section className="space-y-4">
        <h2 className="text-sm font-semibold text-zinc-800">Parties</h2>
        <PartyFieldset
          legend="Party 1"
          party={data.party1}
          onChange={(patch) =>
            onChange((prev) => ({ ...prev, party1: { ...prev.party1, ...patch } }))
          }
        />
        <PartyFieldset
          legend="Party 2"
          party={data.party2}
          onChange={(patch) =>
            onChange((prev) => ({ ...prev, party2: { ...prev.party2, ...patch } }))
          }
        />
      </section>
    </form>
  );
}
