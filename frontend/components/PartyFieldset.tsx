import type { PartyDetails } from "@/lib/nda-data";

// Colors are pinned explicitly (rather than inherited) so typed text stays
// readable regardless of the user's OS light/dark color-scheme preference —
// the app doesn't otherwise support a dark theme.
const inputClasses =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 shadow-sm placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 disabled:bg-zinc-100 disabled:text-zinc-400";
const labelClasses = "block text-xs font-medium text-zinc-600 mb-1";

interface PartyFieldsetProps {
  legend: string;
  party: PartyDetails;
  onChange: (patch: Partial<PartyDetails>) => void;
}

export function PartyFieldset({ legend, party, onChange }: PartyFieldsetProps) {
  return (
    <fieldset className="rounded-lg border border-zinc-200 p-4">
      <legend className="px-1 text-sm font-semibold text-zinc-800">{legend}</legend>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label>
          <span className={labelClasses}>Print name</span>
          <input
            className={inputClasses}
            value={party.name}
            onChange={(e) => onChange({ name: e.target.value })}
          />
        </label>
        <label>
          <span className={labelClasses}>Title</span>
          <input
            className={inputClasses}
            value={party.title}
            onChange={(e) => onChange({ title: e.target.value })}
          />
        </label>
        <label>
          <span className={labelClasses}>Company</span>
          <input
            className={inputClasses}
            value={party.company}
            onChange={(e) => onChange({ company: e.target.value })}
          />
        </label>
        <label>
          <span className={labelClasses}>Date</span>
          <input
            type="date"
            className={inputClasses}
            value={party.date}
            onChange={(e) => onChange({ date: e.target.value })}
          />
        </label>
        <label className="sm:col-span-2">
          <span className={labelClasses}>Notice address (email or postal)</span>
          <input
            className={inputClasses}
            value={party.noticeAddress}
            onChange={(e) => onChange({ noticeAddress: e.target.value })}
          />
        </label>
      </div>
    </fieldset>
  );
}

export { inputClasses, labelClasses };
