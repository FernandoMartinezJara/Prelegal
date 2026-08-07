import type { NdaFormData } from "@/lib/nda-data";
import { fillNdaClauses } from "@/lib/fill-template";
import { RichText } from "./RichText";

function fallback(value: string, placeholder: string) {
  return value.trim() ? value : placeholder;
}

export function NdaPreview({ data }: { data: NdaFormData }) {
  const clauses = fillNdaClauses(data);

  return (
    <article className="prose prose-sm max-w-none rounded-lg border border-zinc-200 bg-white p-6 text-zinc-800">
      <h1 className="text-center text-lg font-bold">Mutual Non-Disclosure Agreement</h1>

      <table className="w-full border-collapse text-sm">
        <tbody>
          <tr>
            <td className="w-1/3 border border-zinc-200 px-2 py-1 font-semibold">Purpose</td>
            <td className="border border-zinc-200 px-2 py-1">
              {fallback(data.purpose, "—")}
            </td>
          </tr>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">Effective Date</td>
            <td className="border border-zinc-200 px-2 py-1">
              {fallback(data.effectiveDate, "—")}
            </td>
          </tr>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">Governing Law</td>
            <td className="border border-zinc-200 px-2 py-1">
              {fallback(data.governingLaw, "—")}
            </td>
          </tr>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">Jurisdiction</td>
            <td className="border border-zinc-200 px-2 py-1">
              {fallback(data.jurisdiction, "—")}
            </td>
          </tr>
          {data.modifications.trim() && (
            <tr>
              <td className="border border-zinc-200 px-2 py-1 font-semibold">
                MNDA Modifications
              </td>
              <td className="border border-zinc-200 px-2 py-1">{data.modifications}</td>
            </tr>
          )}
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
              {fallback(data.party1.name, "—")}
            </td>
            <td className="border border-zinc-200 px-2 py-1 italic">
              {fallback(data.party2.name, "—")}
            </td>
          </tr>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">Print Name</td>
            <td className="border border-zinc-200 px-2 py-1">
              {fallback(data.party1.name, "—")}
            </td>
            <td className="border border-zinc-200 px-2 py-1">
              {fallback(data.party2.name, "—")}
            </td>
          </tr>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">Title</td>
            <td className="border border-zinc-200 px-2 py-1">
              {fallback(data.party1.title, "—")}
            </td>
            <td className="border border-zinc-200 px-2 py-1">
              {fallback(data.party2.title, "—")}
            </td>
          </tr>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">Company</td>
            <td className="border border-zinc-200 px-2 py-1">
              {fallback(data.party1.company, "—")}
            </td>
            <td className="border border-zinc-200 px-2 py-1">
              {fallback(data.party2.company, "—")}
            </td>
          </tr>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">Notice Address</td>
            <td className="border border-zinc-200 px-2 py-1">
              {fallback(data.party1.noticeAddress, "—")}
            </td>
            <td className="border border-zinc-200 px-2 py-1">
              {fallback(data.party2.noticeAddress, "—")}
            </td>
          </tr>
          <tr>
            <td className="border border-zinc-200 px-2 py-1 font-semibold">Date</td>
            <td className="border border-zinc-200 px-2 py-1">
              {fallback(data.party1.date, "—")}
            </td>
            <td className="border border-zinc-200 px-2 py-1">
              {fallback(data.party2.date, "—")}
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
