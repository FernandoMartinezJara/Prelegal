"use client";

import { useState, type KeyboardEvent } from "react";

interface EditableFieldProps {
  value: string;
  onCommit: (value: string) => void;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  type?: "text" | "date";
}

export function EditableField({
  value,
  onCommit,
  label,
  placeholder = "—",
  multiline = false,
  type = "text",
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  function startEditing() {
    setDraft(value);
    setIsEditing(true);
  }

  function commit() {
    onCommit(draft);
    setIsEditing(false);
  }

  function cancel() {
    setIsEditing(false);
  }

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={startEditing}
        aria-label={`Edit ${label}`}
        className="w-full rounded px-1 py-0.5 text-left hover:bg-zinc-50 focus:outline-none focus:ring-1 focus:ring-zinc-400"
      >
        {value.trim() ? value : <span className="text-zinc-400">{placeholder}</span>}
      </button>
    );
  }

  const commonProps = {
    "aria-label": label,
    autoFocus: true,
    value: draft,
    className:
      "w-full rounded border border-zinc-300 px-1 py-0.5 text-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500",
    onBlur: commit,
    onKeyDown: (e: KeyboardEvent) => {
      if (e.key === "Escape") cancel();
      if (e.key === "Enter" && !multiline) commit();
    },
  };

  return multiline ? (
    <textarea {...commonProps} rows={2} onChange={(e) => setDraft(e.target.value)} />
  ) : (
    <input {...commonProps} type={type} onChange={(e) => setDraft(e.target.value)} />
  );
}
