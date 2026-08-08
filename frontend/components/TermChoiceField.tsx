import type { TermChoice } from "@/lib/nda-data";
import { inputClasses, labelClasses } from "./PartyFieldset";

interface TermChoiceFieldProps {
  legend: string;
  fixedLabel: string;
  openEndedLabel: string;
  name: string;
  value: { type: TermChoice; years: number };
  onChange: (value: { type: TermChoice; years: number }) => void;
}

export function TermChoiceField({
  legend,
  fixedLabel,
  openEndedLabel,
  name,
  value,
  onChange,
}: TermChoiceFieldProps) {
  return (
    <fieldset>
      <legend className={labelClasses}>{legend}</legend>
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-zinc-700">
          <label className="flex items-center gap-2">
            <input
              type="radio"
              name={name}
              checked={value.type === "fixed"}
              onChange={() => onChange({ ...value, type: "fixed" })}
            />
            <span>{fixedLabel}</span>
          </label>
          <input
            type="number"
            min={1}
            aria-label="Number of years"
            className={`${inputClasses} w-20`}
            disabled={value.type !== "fixed"}
            value={value.years}
            onChange={(e) => onChange({ ...value, years: Number(e.target.value) || 1 })}
          />
          <span>year(s) from Effective Date</span>
        </div>
        <label className="flex items-center gap-2 text-sm text-zinc-700">
          <input
            type="radio"
            name={name}
            checked={value.type === "open-ended"}
            onChange={() => onChange({ ...value, type: "open-ended" })}
          />
          <span>{openEndedLabel}</span>
        </label>
      </div>
    </fieldset>
  );
}
