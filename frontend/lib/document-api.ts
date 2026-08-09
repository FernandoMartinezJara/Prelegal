import type { DocumentTypeDetail, DocumentTypeSummary } from "./document-schema";

export class DocumentApiError extends Error {}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export async function fetchDocumentCatalog(): Promise<DocumentTypeSummary[]> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/documents`);
  } catch {
    throw new DocumentApiError("Could not reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new DocumentApiError("Could not load the document catalog.");
  }
  return (await response.json()) as DocumentTypeSummary[];
}

export async function fetchDocumentSchema(slug: string): Promise<DocumentTypeDetail> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}/api/documents/${slug}`);
  } catch {
    throw new DocumentApiError("Could not reach the server. Check your connection and try again.");
  }
  if (!response.ok) {
    throw new DocumentApiError(`Could not load the "${slug}" document type.`);
  }
  return (await response.json()) as DocumentTypeDetail;
}
