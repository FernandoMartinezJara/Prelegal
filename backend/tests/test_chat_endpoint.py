from unittest.mock import patch

from app.models.chat import ChatTurnResult
from app.services.chat_service import LlmCallError


def test_chat_endpoint_returns_reply_and_snake_case_field_data(client):
    body = {
        "messages": [{"role": "user", "content": "Let's start"}],
        "documentType": "mutual-nda",
        "fieldData": {},
    }

    with patch(
        "app.routers.chat.generate_chat_turn",
        return_value=ChatTurnResult(
            reply="What's the purpose?", document_type="mutual-nda", field_data={"purpose": ""}
        ),
    ):
        response = client.post("/api/chat", json=body)

    assert response.status_code == 200
    payload = response.json()
    assert payload["reply"] == "What's the purpose?"
    assert payload["documentType"] == "mutual-nda"
    assert "purpose" in payload["fieldData"]


def test_chat_endpoint_returns_502_on_llm_failure(client):
    body = {"messages": [{"role": "user", "content": "Let's start"}], "documentType": None, "fieldData": {}}

    with patch("app.routers.chat.generate_chat_turn", side_effect=LlmCallError("boom")):
        response = client.post("/api/chat", json=body)

    assert response.status_code == 502


def test_chat_endpoint_rejects_empty_messages(client):
    response = client.post("/api/chat", json={"messages": [], "documentType": None, "fieldData": {}})

    assert response.status_code == 422


def test_chat_endpoint_rejects_invalid_role(client):
    body = {"messages": [{"role": "system", "content": "hi"}], "documentType": None, "fieldData": {}}

    response = client.post("/api/chat", json=body)

    assert response.status_code == 422


def test_chat_endpoint_accepts_missing_document_type_and_field_data(client):
    body = {"messages": [{"role": "user", "content": "hi"}]}

    with patch(
        "app.routers.chat.generate_chat_turn",
        return_value=ChatTurnResult(
            reply="What kind of document do you need?", document_type=None, field_data={}
        ),
    ) as mock_generate:
        response = client.post("/api/chat", json=body)

    assert response.status_code == 200
    mock_generate.assert_called_once()
