import type { Dispatch, SetStateAction } from "react";
import type { DocumentTypeDetail } from "@/lib/document-schema";
import type { FieldData, FieldValue, PartyDetails } from "@/lib/field-data";
import { describeTerm, fillDocumentClauses } from "@/lib/fill-template";
import { RichText } from "./RichText";
import { EditableField } from "./EditableField";
import { InlineTermEditor } from "./InlineTermEditor";

interface DocumentPreviewProps {
  schema: DocumentTypeDetail;
  data: FieldData;
  onChange: Dispatch<SetStateAction<FieldData>>;
}

export function DocumentPreview({ schema, data, onChange }: DocumentPreviewProps) {
  const clauses = fillDocumentClauses(schema, data);

  function updateField(key: string, value: FieldValue) {
    onChange((prev) => ({ ...prev, [key]: value }));
  }

  function updateParty(partyKey: string, patch: Partial<PartyDetails>) {
    onChange((prev) => ({ ...prev, [partyKey]: { ...(prev[partyKey] as PartyDetails), ...patch } }));
  }

  function fieldCommitter(key: string) {
    return (value: FieldValue) => updateField(key, value);
  }

  function partyFieldCommitter(partyKey: string, subKey: keyof PartyDetails) {
    return (value: string) => updateParty(partyKey, { [subKey]: value });
  }

  return (
    <article className="prose prose-sm max-w-none rounded-lg border border-zinc-200 bg-white p-6 text-zinc-800">
      <h1 className="text-center text-lg font-bold">{schema.name}</h1>

      <table className="w-full border-collapse text-sm">
        <tbody>
          {schema.fields.map((field) => (
            <tr key={field.key}>
              <td className="w-1/3 border border-zinc-200 px-2 py-1 font-semibold">{field.label}</td>
              <td className="border border-zinc-200 px-2 py-1">
                {field.kind === "term" ? (
                  <InlineTermEditor
                    legend={field.label}
                    name={field.key}
                    fixedLabel="Expires"
                    openEndedLabel="Continues until terminated"
                    value={data[field.key] as { type: "fixed" | "open-ended"; years: number }}
                    describe={describeTerm}
                    onCommit={fieldCommitter(field.key)}
                  />
                ) : (
                  <EditableField
                    label={field.label}
                    value={data[field.key] as string}
                    multiline={field.kind === "multiline"}
                    type={field.kind === "date" ? "date" : "text"}
                    onCommit={fieldCommitter(field.key)}
                  />
                )}
              </td>
            </tr>
          ))}
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

      {schema.partyRoles.length > 0 && (
        <>
          <p className="text-sm">
            By signing below, each party agrees to enter into this agreement.
          </p>

          <table className="w-full border-collapse text-sm">
            <thead>
              <tr>
                <th className="border border-zinc-200 px-2 py-1 text-left">&nbsp;</th>
                {schema.partyRoles.map((role) => (
                  <th key={role} className="border border-zinc-200 px-2 py-1 text-left">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-zinc-200 px-2 py-1 font-semibold">Signature</td>
                {schema.partyRoles.map((role, index) => {
                  const party = data[`party${index + 1}`] as PartyDetails;
                  return (
                    <td key={role} className="border border-zinc-200 px-2 py-1 italic">
                      {party.name.trim() ? party.name : "—"}
                    </td>
                  );
                })}
              </tr>
              {(
                [
                  ["Print Name", "name"],
                  ["Title", "title"],
                  ["Company", "company"],
                  ["Notice Address", "notice_address"],
                  ["Date", "date"],
                ] as Array<[string, keyof PartyDetails]>
              ).map(([label, subKey]) => (
                <tr key={subKey}>
                  <td className="border border-zinc-200 px-2 py-1 font-semibold">{label}</td>
                  {schema.partyRoles.map((role, index) => {
                    const partyKey = `party${index + 1}`;
                    const party = data[partyKey] as PartyDetails;
                    return (
                      <td key={role} className="border border-zinc-200 px-2 py-1">
                        <EditableField
                          label={label}
                          type={subKey === "date" ? "date" : "text"}
                          value={party[subKey]}
                          onCommit={partyFieldCommitter(partyKey, subKey)}
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <p className="text-xs text-zinc-500">
        Based on a Common Paper standard-terms template. Review with counsel before use.
      </p>
    </article>
  );
}
