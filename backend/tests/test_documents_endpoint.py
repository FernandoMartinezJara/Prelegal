def test_list_documents_returns_all_eleven(client):
    response = client.get("/api/documents")

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 11
    slugs = {entry["slug"] for entry in body}
    assert "mutual-nda" in slugs
    assert "csa" in slugs


def test_get_document_detail_returns_fields_and_clauses(client):
    response = client.get("/api/documents/pilot-agreement")

    assert response.status_code == 200
    body = response.json()
    assert body["slug"] == "pilot-agreement"
    assert body["partyRoles"] == ["Provider", "Customer"]
    assert any(f["key"] == "effective_date" for f in body["fields"])
    assert len(body["clauses"]) > 0


def test_get_document_detail_404s_for_unknown_slug(client):
    response = client.get("/api/documents/not-a-real-document")

    assert response.status_code == 404
