import type { RichSegment } from "@/lib/fill-template";

export function RichText({ segments }: { segments: RichSegment[] }) {
  return (
    <>
      {segments.map((segment, index) =>
        segment.bold ? (
          <strong key={index}>{segment.text}</strong>
        ) : (
          <span key={index}>{segment.text}</span>
        )
      )}
    </>
  );
}
