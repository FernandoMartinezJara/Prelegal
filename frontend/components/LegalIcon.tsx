export function LegalIcon({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M12 3v17" stroke="#032147" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M6 21h12" stroke="#032147" strokeWidth={1.6} strokeLinecap="round" />
      <path d="M4 7h7M13 7h7" stroke="#209dd7" strokeWidth={1.6} strokeLinecap="round" />
      <path
        d="M4 7l-2.5 5.5a3 3 0 005 0L4 7z"
        stroke="#753991"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <path
        d="M20 7l-2.5 5.5a3 3 0 005 0L20 7z"
        stroke="#753991"
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <circle cx="12" cy="3" r="1.4" fill="#ecad0a" />
    </svg>
  );
}
