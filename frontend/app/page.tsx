"use client";

import { useState } from "react";
import type { DocumentTypeDetail } from "@/lib/document-schema";
import type { FieldData } from "@/lib/field-data";
import { createDefaultFieldData } from "@/lib/field-data";
import { fetchDocumentSchema } from "@/lib/document-api";
import { ChatPanel } from "@/components/ChatPanel";
import { DocumentPreview } from "@/components/DocumentPreview";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";

export default function Home() {
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [schema, setSchema] = useState<DocumentTypeDetail | null>(null);
  const [fieldData, setFieldData] = useState<FieldData>({});
  const [schemaError, setSchemaError] = useState<string | null>(null);

  async function handleDocumentTypeChange(slug: string | null, resolvedFieldData: FieldData) {
    if (slug === null) {
      setDocumentType(null);
      setSchema(null);
      setFieldData({});
      return;
    }
    try {
      const nextSchema = await fetchDocumentSchema(slug);
      setSchema(nextSchema);
      setDocumentType(slug);
      setFieldData({ ...createDefaultFieldData(nextSchema), ...resolvedFieldData });
      setSchemaError(null);
    } catch {
      setSchemaError("Couldn't load that document type. Please try again.");
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-8">
      <header className="mx-auto mb-6 flex max-w-6xl items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Prelegal Document Creator</h1>
          <p className="text-sm text-zinc-500">
            Tell the assistant what agreement you need, then review and download it below.
          </p>
        </div>
        {schema && <DownloadPdfButton schema={schema} data={fieldData} />}
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <ChatPanel
            documentType={documentType}
            fieldData={fieldData}
            onDocumentTypeChange={handleDocumentTypeChange}
            onFieldDataChange={setFieldData}
          />
        </div>
        <div className="lg:sticky lg:top-8 lg:self-start">
          {schemaError && <p className="mb-2 text-sm text-red-700">{schemaError}</p>}
          {schema ? (
            <DocumentPreview schema={schema} data={fieldData} onChange={setFieldData} />
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
              Describe the agreement you need in the chat to get started.
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
