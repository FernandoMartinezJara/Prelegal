from unittest.mock import MagicMock, patch

import pytest

from app.models.chat import ChatMessage, ChatTurnResult
from app.models.nda import NdaFormData
from app.services.nda_chat import LlmCallError, generate_chat_turn


def fake_completion_response(result: ChatTurnResult) -> MagicMock:
    response = MagicMock()
    response.choices[0].message.content = result.model_dump_json(by_alias=True)
    return response


def test_generate_chat_turn_returns_parsed_result(sample_nda_data):
    expected = ChatTurnResult(
        reply="What's the purpose of sharing confidential information?",
        nda_data=sample_nda_data,
    )
    history = [ChatMessage(role="user", content="Let's draft an NDA")]

    with patch(
        "app.services.nda_chat.completion", return_value=fake_completion_response(expected)
    ) as mock_completion:
        result = generate_chat_turn(history, sample_nda_data)

    assert result == expected
    mock_completion.assert_called_once()


def test_generate_chat_turn_sends_current_data_as_system_context(sample_nda_data):
    sample_nda_data.purpose = "Evaluating a partnership"
    expected = ChatTurnResult(reply="Got it.", nda_data=sample_nda_data)
    history = [ChatMessage(role="user", content="The purpose is a partnership")]

    with patch(
        "app.services.nda_chat.completion", return_value=fake_completion_response(expected)
    ) as mock_completion:
        generate_chat_turn(history, sample_nda_data)

    sent_messages = mock_completion.call_args.kwargs["messages"]
    assert sent_messages[0]["role"] == "system"
    assert "Evaluating a partnership" in sent_messages[0]["content"]
    assert sent_messages[1] == {"role": "user", "content": "The purpose is a partnership"}


def test_generate_chat_turn_wraps_completion_failure(sample_nda_data):
    history = [ChatMessage(role="user", content="hi")]

    with patch("app.services.nda_chat.completion", side_effect=RuntimeError("network down")):
        with pytest.raises(LlmCallError):
            generate_chat_turn(history, sample_nda_data)


def test_generate_chat_turn_wraps_malformed_response(sample_nda_data):
    history = [ChatMessage(role="user", content="hi")]
    response = MagicMock()
    response.choices[0].message.content = "not valid json"

    with patch("app.services.nda_chat.completion", return_value=response):
        with pytest.raises(LlmCallError):
            generate_chat_turn(history, sample_nda_data)
