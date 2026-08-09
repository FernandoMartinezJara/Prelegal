"use client";

import { useState, type KeyboardEvent } from "react";
import type { TermChoice } from "@/lib/field-data";

interface TermValue {
  type: TermChoice;
  years: number;
}

interface InlineTermEditorProps {
  legend: string;
  fixedLabel: string;
  openEndedLabel: string;
  name: string;
  value: TermValue;
  describe: (type: TermChoice, years: number) => string;
  onCommit: (value: TermValue) => void;
}

export function InlineTermEditor({
  legend,
  fixedLabel,
  openEndedLabel,
  name,
  value,
  describe,
  onCommit,
}: InlineTermEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [yearsDraft, setYearsDraft] = useState(String(value.years));

  function startEditing() {
    setYearsDraft(String(value.years));
    setIsEditing(true);
  }

  function commitYears() {
    onCommit({ type: value.type, years: Number(yearsDraft) || 1 });
  }

  // Reads the in-progress years draft rather than `value.years` so switching
  // the radio right after typing (before the years field blurs) doesn't lose
  // the typed digits to a stale-prop race between the two onCommit calls.
  function commitType(type: TermChoice) {
    onCommit({ type, years: Number(yearsDraft) || value.years });
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={startEditing}
        aria-label={`Edit ${legend}`}
        className="w-full rounded px-1 py-0.5 text-left hover:bg-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-400"
      >
        {describe(value.type, value.years)}
      </button>
    );
  }

  return (
    <div className="space-y-2 text-sm text-zinc-700">
      <div className="flex items-center gap-2">
        <label className="flex items-center gap-2">
          <input
            type="radio"
            name={name}
            checked={value.type === "fixed"}
            onChange={() => commitType("fixed")}
          />
          <span>{fixedLabel}</span>
        </label>
        <input
          type="number"
          min={1}
          aria-label={`${legend} years`}
          className="w-16 rounded border border-zinc-300 px-1 py-0.5 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500"
          disabled={value.type !== "fixed"}
          value={yearsDraft}
          onChange={(e) => setYearsDraft(e.target.value)}
          onBlur={commitYears}
          onKeyDown={(e: KeyboardEvent) => {
            if (e.key === "Enter") commitYears();
          }}
        />
      </div>
      <label className="flex items-center gap-2">
        <input
          type="radio"
          name={name}
          checked={value.type === "open-ended"}
          onChange={() => commitType("open-ended")}
        />
        <span>{openEndedLabel}</span>
      </label>
      <button
        type="button"
        onClick={() => setIsEditing(false)}
        className="text-xs font-medium text-zinc-500 underline"
      >
        Done
      </button>
    </div>
  );
}
