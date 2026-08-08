# Mutual NDA Creator

A prototype (Jira PL-3) that lets a user fill in a form with key details and
generates a completed [Common Paper Mutual NDA](https://commonpaper.com/standards/mutual-nda/1.0/)
(CC BY 4.0), with a live preview and a downloadable PDF.

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Testing

```bash
npm run test           # run once
npm run test:watch     # watch mode
npm run test:coverage  # run with a coverage report (enforces an 80% minimum)
```

Tests use [Vitest](https://vitest.dev/) and [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/).
`lib/nda-pdf.test.ts` runs in Vitest's `node` environment and asserts on the
actual generated PDF bytes (decoding its compressed text content) rather than
mocking `@react-pdf/renderer`, since its `Document`/`Page`/`Text` primitives
aren't DOM elements RTL can render.

## How it works

- `lib/nda-template.ts` — the 11 Mutual NDA clauses, transcribed from
  `../templates/Mutual-NDA.md` at the repo root, with cover-page variables
  replaced by `{{token}}` placeholders.
- `lib/nda-data.ts` — the form data model and its defaults.
- `lib/fill-template.ts` — the single place that substitutes form data into
  the clause templates and splits `**bold**` markers into rich-text
  segments. Both renderers below consume this, so they can never drift out
  of sync.
- `components/NdaForm.tsx` — the input form.
- `components/NdaPreview.tsx` — the live, on-screen HTML preview.
- `lib/nda-pdf.tsx` + `components/DownloadPdfButton.tsx` — a
  [`@react-pdf/renderer`](https://react-pdf.org/) document built from the
  same filled clause data, generated client-side and downloaded as a PDF.
  The PDF library is dynamically imported on click so it never ships in the
  initial page bundle or runs during server rendering.

This is a prototype: it doesn't collect real e-signatures, doesn't persist
data anywhere, and only supports the Mutual NDA template.
