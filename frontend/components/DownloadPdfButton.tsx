"use client";

import { useState } from "react";
import type { DocumentTypeDetail } from "@/lib/document-schema";
import type { FieldData } from "@/lib/field-data";

export function DownloadPdfButton({
  schema,
  data,
}: {
  schema: DocumentTypeDetail;
  data: FieldData;
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleDownload() {
    setIsGenerating(true);
    try {
      const [{ pdf }, { DocumentPdfDocument }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/lib/document-pdf"),
      ]);
      const blob = await pdf(<DocumentPdfDocument schema={schema} data={data} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${schema.slug}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Failed to generate document PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleDownload}
      disabled={isGenerating}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isGenerating ? "Generating PDF…" : "Download PDF"}
    </button>
  );
}
