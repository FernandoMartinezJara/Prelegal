import { afterEach, describe, expect, it, vi } from "vitest";
import { DocumentApiError, fetchDocumentCatalog, fetchDocumentSchema } from "./document-api";

describe("fetchDocumentCatalog", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns the parsed catalog", async () => {
    const catalog = [{ slug: "mutual-nda", name: "Mutual NDA", description: "..." }];
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(catalog) }));

    const result = await fetchDocumentCatalog();

    expect(result).toEqual(catalog);
  });

  it("throws DocumentApiError when the response is not ok", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    await expect(fetchDocumentCatalog()).rejects.toThrow(DocumentApiError);
  });

  it("throws DocumentApiError when fetch itself fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    await expect(fetchDocumentCatalog()).rejects.toThrow(DocumentApiError);
  });
});

describe("fetchDocumentSchema", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches the schema for a given slug", async () => {
    const schema = { slug: "pilot-agreement", name: "Pilot Agreement", description: "...", partyRoles: [], fields: [], clauses: [] };
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: () => Promise.resolve(schema) });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchDocumentSchema("pilot-agreement");

    expect(fetchMock).toHaveBeenCalledWith("/api/documents/pilot-agreement");
    expect(result).toEqual(schema);
  });

  it("throws DocumentApiError on a 404", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false }));

    await expect(fetchDocumentSchema("unknown")).rejects.toThrow(DocumentApiError);
  });
});
