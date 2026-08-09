# Prelegal Document Creator

A prototype that lets a user chat with an AI assistant to draft any of the 11
document types in the repo root's `catalog.json` (Common Paper standard-terms
templates, CC BY 4.0), with a live, directly-editable preview and a
downloadable PDF.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Running against a
standalone backend (rather than the full Docker image) needs
`NEXT_PUBLIC_API_BASE_URL=http://localhost:8000` in `frontend/.env.local`.

## Testing

```bash
npm run test           # run once
npm run test:watch     # watch mode
npm run test:coverage  # run with a coverage report (enforces an 80% minimum)
```

Tests use [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).
`lib/document-pdf.test.tsx` calls the PDF document component directly (rather
than mounting it) and walks the returned element tree, since
`@react-pdf/renderer`'s `Document`/`Page`/`Text` primitives aren't DOM
elements RTL can render.

## How it works

Nothing here is hardcoded to a single document type — the backend is the
source of truth for which document types exist and what fields they need
(`GET /api/documents`, `GET /api/documents/{slug}`); the frontend renders
whatever schema comes back.

- `lib/document-schema.ts` — TypeScript mirrors of the backend's document-type
  schema (fields, party roles, clauses).
- `lib/field-data.ts` — the generic field-value shape (`FieldData`) and
  default-value construction for a given schema.
- `lib/document-api.ts` — fetches the document-type catalog and a single
  type's schema.
- `lib/chat-api.ts` — sends a chat turn (`messages` + `documentType` +
  `fieldData`) and returns the assistant's reply plus the updated field data.
- `lib/merge-field-data.ts` — merges an assistant reply's field data onto the
  latest known state via a structural walk (works for any document type's
  shape), so a chat reply in flight can't clobber a concurrent inline edit.
- `lib/fill-template.ts` — substitutes field data into a schema's clause
  templates and splits `**bold**` markers into rich-text segments. Both
  renderers below consume this, so they can never drift out of sync.
- `components/ChatPanel.tsx` — the chat UI; also owns the "return focus to the
  message box after every turn" behavior.
- `components/DocumentPreview.tsx` — the live, on-screen, directly-editable
  HTML preview, driven entirely by the active document type's schema.
- `lib/document-pdf.tsx` + `components/DownloadPdfButton.tsx` — a
  [`@react-pdf/renderer`](https://react-pdf.org/) document built from the same
  filled clause data, generated client-side and downloaded as a PDF. The PDF
  library is dynamically imported on click so it never ships in the initial
  page bundle or runs during server rendering.

This is a prototype: it doesn't collect real e-signatures and doesn't persist
data anywhere (no accounts, no saved documents — everything lives in the
browser tab for the current session).
