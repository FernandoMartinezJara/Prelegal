// @vitest-environment node
import { describe, expect, it } from "vitest";
import { pdf } from "@react-pdf/renderer";
import { NdaPdfDocument } from "./nda-pdf";
import { createDefaultNdaFormData } from "./nda-data";

/** @react-pdf/renderer encodes text as hex glyph strings (`<...>`) inside
 * Tj/TJ operators in the (Flate-compressed) content stream. Decoding them
 * back to plain text lets us assert on the PDF's actual rendered content. */
async function extractPdfText(data: ReturnType<typeof createDefaultNdaFormData>) {
  const zlib = await import("node:zlib");
  const instance = pdf(NdaPdfDocument({ data }));
  const buffer = await instance.toBuffer();
  const chunks: Buffer[] = [];
  for await (const chunk of buffer) chunks.push(chunk as Buffer);
  const raw = Buffer.concat(chunks);

  let text = "";
  for (const match of raw.toString("latin1").matchAll(/stream\r?\n([\s\S]*?)endstream/g)) {
    let decompressed: Buffer;
    try {
      decompressed = zlib.inflateSync(Buffer.from(match[1], "latin1"));
    } catch {
      continue;
    }
    for (const hex of decompressed.toString("latin1").matchAll(/<([0-9a-fA-F]+)>/g)) {
      text += Buffer.from(hex[1], "hex").toString("latin1");
    }
  }
  return text;
}

describe("NdaPdfDocument", () => {
  it("produces a valid PDF", async () => {
    const instance = pdf(NdaPdfDocument({ data: createDefaultNdaFormData() }));
    const buffer = await instance.toBuffer();
    const chunks: Buffer[] = [];
    for await (const chunk of buffer) chunks.push(chunk as Buffer);
    const raw = Buffer.concat(chunks);
    expect(raw.subarray(0, 5).toString("latin1")).toBe("%PDF-");
  });

  it("embeds the substituted party names, governing law, and jurisdiction", async () => {
    const data = createDefaultNdaFormData();
    data.governingLaw = "Delaware";
    data.jurisdiction = "courts located in New Castle, DE";
    data.party1.name = "Alice Smith";
    data.party2.name = "Bob Jones";

    const text = await extractPdfText(data);

    expect(text).toContain("Delaware");
    expect(text).toContain("New Castle");
    expect(text).toContain("Alice Smith");
    expect(text).toContain("Bob Jones");
    expect(text).toContain("Introduction");
    expect(text).toContain("Governing Law and Jurisdiction");
  });

  it("shows each party's own name in its own signature column", async () => {
    const data = createDefaultNdaFormData();
    data.party1.name = "Alice Smith";
    data.party2.name = "Bob Jones";

    const text = await extractPdfText(data);
    const signatureIndex = text.indexOf("Signature");
    const nearby = text.slice(signatureIndex, signatureIndex + 60);

    expect(nearby).toContain("Alice Smith");
    expect(nearby).toContain("Bob Jones");
  });

  it("only includes the MNDA Modifications row when modifications are provided", async () => {
    const withoutMods = await extractPdfText(createDefaultNdaFormData());
    expect(withoutMods).not.toContain("MNDA Modifications");

    const data = createDefaultNdaFormData();
    data.modifications = "Section 5 term extended to 2 years.";
    const withMods = await extractPdfText(data);
    expect(withMods).toContain("MNDA Modifications");
    expect(withMods).toContain("Section 5 term extended to 2 years.");
  });

  it("falls back to a placeholder for blank required fields", async () => {
    const text = await extractPdfText(createDefaultNdaFormData());
    expect(text).toContain("[Governing Law not provided]");
    expect(text).toContain("[Jurisdiction not provided]");
  });
});
