"use client";

import { useState } from "react";
import type { DocumentTypeDetail } from "@/lib/document-schema";
import type { FieldData } from "@/lib/field-data";
import { createDefaultFieldData } from "@/lib/field-data";
import { fetchDocumentSchema } from "@/lib/document-api";
import { DEFAULT_UI_STRINGS } from "@/lib/ui-strings";
import { ChatPanel } from "@/components/ChatPanel";
import { DocumentPreview } from "@/components/DocumentPreview";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";
import { LegalIcon } from "@/components/LegalIcon";
import { Spinner } from "@/components/Spinner";

export default function Home() {
  const [documentType, setDocumentType] = useState<string | null>(null);
  const [schema, setSchema] = useState<DocumentTypeDetail | null>(null);
  const [fieldData, setFieldData] = useState<FieldData>({});
  const [language, setLanguage] = useState("en");
  const [isLoadingSchema, setIsLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  const uiStrings = schema?.uiStrings ?? DEFAULT_UI_STRINGS;

  async function loadSchema(slug: string, lang: string): Promise<DocumentTypeDetail | null> {
    setIsLoadingSchema(true);
    try {
      const nextSchema = await fetchDocumentSchema(slug, lang);
      setSchemaError(null);
      return nextSchema;
    } catch {
      setSchemaError(uiStrings.schemaLoadError);
      return null;
    } finally {
      setIsLoadingSchema(false);
    }
  }

  async function handleDocumentTypeChange(
    slug: string | null,
    resolvedFieldData: FieldData,
    resolvedLanguage: string
  ) {
    setLanguage(resolvedLanguage);
    if (slug === null) {
      setDocumentType(null);
      setSchema(null);
      setFieldData({});
      return;
    }
    const nextSchema = await loadSchema(slug, resolvedLanguage);
    if (!nextSchema) return;
    setSchema(nextSchema);
    setDocumentType(slug);
    setFieldData({ ...createDefaultFieldData(nextSchema), ...resolvedFieldData });
  }

  async function handleLanguageChange(nextLanguage: string) {
    if (nextLanguage === language) return;
    setLanguage(nextLanguage);
    // The user switched languages mid-conversation; re-fetch the already-
    // resolved document's schema (and translated clause text) to match.
    if (documentType) {
      const nextSchema = await loadSchema(documentType, nextLanguage);
      if (nextSchema) setSchema(nextSchema);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-8">
      <header className="mx-auto mb-6 flex max-w-6xl items-center justify-between">
        <div className="flex items-center gap-3">
          <LegalIcon className="h-9 w-9 shrink-0" />
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Prelegal Document Creator</h1>
            <p className="text-sm text-zinc-500">{uiStrings.subtitle}</p>
          </div>
        </div>
        {schema && <DownloadPdfButton schema={schema} data={fieldData} uiStrings={uiStrings} />}
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <ChatPanel
            documentType={documentType}
            fieldData={fieldData}
            uiStrings={uiStrings}
            onDocumentTypeChange={handleDocumentTypeChange}
            onFieldDataChange={setFieldData}
            onLanguageChange={handleLanguageChange}
          />
        </div>
        <div className="lg:sticky lg:top-8 lg:self-start">
          {schemaError && <p className="mb-2 text-sm text-red-700">{schemaError}</p>}
          {schema?.translationDisclaimer && (
            <p className="mb-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {schema.translationDisclaimer}
            </p>
          )}
          {isLoadingSchema ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-sm text-zinc-500">
              <Spinner className="h-5 w-5 text-zinc-400" />
              {uiStrings.chatThinking}
            </div>
          ) : schema ? (
            <DocumentPreview schema={schema} data={fieldData} onChange={setFieldData} />
          ) : (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-white p-8 text-center text-sm text-zinc-500">
              {uiStrings.emptyStatePlaceholder}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
