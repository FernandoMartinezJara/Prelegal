import type { Dispatch, SetStateAction } from "react";
import type { NdaFormData, PartyDetails } from "@/lib/nda-data";
import { describeConfidentialityTerm, describeMndaTerm, fillNdaClauses } from "@/lib/fill-template";
import { RichText } from "./RichText";
import { EditableField } from "./EditableField";
import { InlineTermEditor } from "./InlineTermEditor";

interface NdaPreviewProps {
  data: NdaFormData;
  onChange: Dispatch<SetStateAction<NdaFormData>>;
}

export function NdaPreview({ data, onChange }: NdaPreviewProps) {
  const clauses = fillNdaClauses(data);

  function updateField<K extends keyof NdaFormData>(key: K, value: NdaFormData[K]) {
    onChange((prev) => ({ ...prev, [key]: value }));
  }

  function updateParty(party: "party1" | "party2", patch: Partial<PartyDetails>) {
    onChange((prev) => ({ ...prev, [party]: { ...prev[party], ...patch } }));
  }

  function fieldCommitter<K extends keyof NdaFormData>(key: K) {
    return (value: NdaFormData[K]) => updateField(key, value);
  }

  function partyFieldCommitter<K extends keyof PartyDetails>(
    party: "party1" | "party2",
    key: K
  ) {
    return (value: PartyDetails[K]) => updateParty(party, { [key]: value });
  }

  return (
    <article className="prose prose-sm max-w-none rounded-lg border border-zinc-200 bg-white p-6 text-zinc-800">
      <h1 className="text-center text-lg font-bold">Mutual Non-Disclosure Agreement</h1>

      <table className="w-full border-collapse text-sm">
        <tbody>
          <tr>
            <td className="w-1/3 border border-zinc-200 px-2 py-1 font-semibold">Purpose</td>
            <td className="border border-zinc-200 px-2 py-1">
              <EditableField
                label="Purpose"
                value={data.purpose}
                multiline
                onCommit={fieldCommitter("purpose")}
              />
            </td>
          </tr>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">Effective Date</td>
            <td className="border border-zinc-200 px-2 py-1">
              <EditableField
                label="Effective date"
                type="date"
                value={data.effectiveDate}
                onCommit={fieldCommitter("effectiveDate")}
              />
            </td>
          </tr>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">MNDA Term</td>
            <td className="border border-zinc-200 px-2 py-1">
              <InlineTermEditor
                legend="MNDA term"
                name="mndaTerm"
                fixedLabel="Expires"
                openEndedLabel="Continues until terminated in accordance with the terms of the MNDA"
                value={data.mndaTerm}
                describe={describeMndaTerm}
                onCommit={fieldCommitter("mndaTerm")}
              />
            </td>
          </tr>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">
              Term of Confidentiality
            </td>
            <td className="border border-zinc-200 px-2 py-1">
              <InlineTermEditor
                legend="Term of confidentiality"
                name="confidentialityTerm"
                fixedLabel="Expires"
                openEndedLabel="In perpetuity"
                value={data.confidentialityTerm}
                describe={describeConfidentialityTerm}
                onCommit={fieldCommitter("confidentialityTerm")}
              />
            </td>
          </tr>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">Governing Law</td>
            <td className="border border-zinc-200 px-2 py-1">
              <EditableField
                label="Governing law"
                value={data.governingLaw}
                onCommit={fieldCommitter("governingLaw")}
              />
            </td>
          </tr>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">Jurisdiction</td>
            <td className="border border-zinc-200 px-2 py-1">
              <EditableField
                label="Jurisdiction"
                value={data.jurisdiction}
                onCommit={fieldCommitter("jurisdiction")}
              />
            </td>
          </tr>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">
              MNDA Modifications
            </td>
            <td className="border border-zinc-200 px-2 py-1">
              <EditableField
                label="MNDA modifications"
                value={data.modifications}
                multiline
                onCommit={fieldCommitter("modifications")}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <ol className="list-none space-y-3 pl-0">
        {clauses.map((clause) => (
          <li key={clause.number} className="flex gap-2">
            <span className="shrink-0 font-semibold">{clause.number}.</span>
            <p className="m-0">
              <RichText segments={clause.segments} />
            </p>
          </li>
        ))}
      </ol>

      <p className="text-sm">
        By signing below, each party agrees to enter into this MNDA as of the Effective Date.
      </p>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>
            <th className="border border-zinc-200 px-2 py-1 text-left">&nbsp;</th>
            <th className="border border-zinc-200 px-2 py-1 text-left">Party 1</th>
            <th className="border border-zinc-200 px-2 py-1 text-left">Party 2</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">Signature</td>
            <td className="border border-zinc-200 px-2 py-1 italic">
              {data.party1.name.trim() ? data.party1.name : "—"}
            </td>
            <td className="border border-zinc-200 px-2 py-1 italic">
              {data.party2.name.trim() ? data.party2.name : "—"}
            </td>
          </tr>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">Print Name</td>
            <td className="border border-zinc-200 px-2 py-1">
              <EditableField
                label="Print name"
                value={data.party1.name}
                onCommit={partyFieldCommitter("party1", "name")}
              />
            </td>
            <td className="border border-zinc-200 px-2 py-1">
              <EditableField
                label="Print name"
                value={data.party2.name}
                onCommit={partyFieldCommitter("party2", "name")}
              />
            </td>
          </tr>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">Title</td>
            <td className="border border-zinc-200 px-2 py-1">
              <EditableField
                label="Title"
                value={data.party1.title}
                onCommit={partyFieldCommitter("party1", "title")}
              />
            </td>
            <td className="border border-zinc-200 px-2 py-1">
              <EditableField
                label="Title"
                value={data.party2.title}
                onCommit={partyFieldCommitter("party2", "title")}
              />
            </td>
          </tr>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">Company</td>
            <td className="border border-zinc-200 px-2 py-1">
              <EditableField
                label="Company"
                value={data.party1.company}
                onCommit={partyFieldCommitter("party1", "company")}
              />
            </td>
            <td className="border border-zinc-200 px-2 py-1">
              <EditableField
                label="Company"
                value={data.party2.company}
                onCommit={partyFieldCommitter("party2", "company")}
              />
            </td>
          </tr>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">Notice Address</td>
            <td className="border border-zinc-200 px-2 py-1">
              <EditableField
                label="Notice address"
                value={data.party1.noticeAddress}
                onCommit={partyFieldCommitter("party1", "noticeAddress")}
              />
            </td>
            <td className="border border-zinc-200 px-2 py-1">
              <EditableField
                label="Notice address"
                value={data.party2.noticeAddress}
                onCommit={partyFieldCommitter("party2", "noticeAddress")}
              />
            </td>
          </tr>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">Date</td>
            <td className="border border-zinc-200 px-2 py-1">
              <EditableField
                label="Date"
                type="date"
                value={data.party1.date}
                onCommit={partyFieldCommitter("party1", "date")}
              />
            </td>
            <td className="border border-zinc-200 px-2 py-1">
              <EditableField
                label="Date"
                type="date"
                value={data.party2.date}
                onCommit={partyFieldCommitter("party2", "date")}
              />
            </td>
          </tr>
        </tbody>
      </table>

      <p className="text-xs text-zinc-500">
        Common Paper Mutual Non-Disclosure Agreement Version 1.0, free to use under{" "}
        <a href="https://creativecommons.org/licenses/by/4.0/">CC BY 4.0</a>.
      </p>
    </article>
  );
}
