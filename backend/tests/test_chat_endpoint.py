from unittest.mock import MagicMock, patch

from app.models.chat import ChatTurnResult
from app.models.nda import NdaFormData
from app.services.nda_chat import LlmCallError


def fake_completion_response(result: ChatTurnResult) -> MagicMock:
    response = MagicMock()
    response.choices[0].message.content = result.model_dump_json(by_alias=True)
    return response


def test_chat_endpoint_returns_reply_and_camel_case_nda_data(client):
    expected = ChatTurnResult(reply="What's the purpose?", nda_data=NdaFormData())
    body = {"messages": [{"role": "user", "content": "Let's start"}], "ndaData": {}}

    with patch(
        "app.services.nda_chat.completion", return_value=fake_completion_response(expected)
    ):
        response = client.post("/api/chat", json=body)

    assert response.status_code == 200
    payload = response.json()
    assert payload["reply"] == "What's the purpose?"
    assert "ndaData" in payload
    assert "mndaTerm" in payload["ndaData"]


def test_chat_endpoint_returns_502_on_llm_failure(client):
    body = {"messages": [{"role": "user", "content": "Let's start"}], "ndaData": {}}

    with patch("app.routers.chat.generate_chat_turn", side_effect=LlmCallError("boom")):
        response = client.post("/api/chat", json=body)

    assert response.status_code == 502


def test_chat_endpoint_rejects_empty_messages(client):
    response = client.post("/api/chat", json={"messages": [], "ndaData": {}})

    assert response.status_code == 422


def test_chat_endpoint_rejects_invalid_role(client):
    body = {"messages": [{"role": "system", "content": "hi"}], "ndaData": {}}

    response = client.post("/api/chat", json=body)

    assert response.status_code == 422
