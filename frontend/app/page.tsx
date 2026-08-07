"use client";

import { useState } from "react";
import { createDefaultNdaFormData } from "@/lib/nda-data";
import { NdaForm } from "@/components/NdaForm";
import { NdaPreview } from "@/components/NdaPreview";
import { DownloadPdfButton } from "@/components/DownloadPdfButton";

export default function Home() {
  const [data, setData] = useState(createDefaultNdaFormData);

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-8">
      <header className="mx-auto mb-6 flex max-w-6xl items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-zinc-900">Mutual NDA Creator</h1>
          <p className="text-sm text-zinc-500">
            Fill in the details below and download a completed Mutual Non-Disclosure Agreement.
          </p>
        </div>
        <DownloadPdfButton data={data} />
      </header>

      <main className="mx-auto grid max-w-6xl grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 bg-white p-4">
          <NdaForm data={data} onChange={setData} />
        </div>
        <div className="lg:sticky lg:top-8 lg:self-start">
          <NdaPreview data={data} />
        </div>
      </main>
    </div>
  );
}
