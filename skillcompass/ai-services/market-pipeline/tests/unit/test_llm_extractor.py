import pytest
import json
from unittest.mock import patch, MagicMock
from processors.llm_extractor import extract_competencies_from_jd

@pytest.fixture
def mock_openai_client():
    mock_client = MagicMock()
    # Mock completion response
    mock_choice = MagicMock()
    mock_choice.message.content = "{}"
    mock_response = MagicMock()
    mock_response.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_response
    return mock_client

def test_extract_success(mock_openai_client):
    """TC-LLM-01: Parse thành công JSON hợp lệ từ LLM"""
    valid_json = {
        "core_competencies": {
            "analytical_thinking": 8, "problem_solving": 8,
            "effective_communication": 6, "continuous_learning": 8,
            "team_collaboration": 7, "creativity_innovation": 5,
            "adaptability_resilience": 7, "critical_thinking": 7,
            "responsibility_autonomy": 8, "work_ethics_integrity": 7
        },
        "domain_competencies": {
            "python_programming": {"weight_omega": 0.9, "required_level": 8}
        }
    }
    mock_openai_client.chat.completions.create.return_value.choices[0].message.content = json.dumps(valid_json)
    
    with patch("processors.llm_extractor.get_llm_client", return_value=mock_openai_client):
        res = extract_competencies_from_jd("Backend Engineer", "JD text here")
        
    assert res == valid_json
    mock_openai_client.chat.completions.create.assert_called_once()

def test_extract_with_markdown_wrapper(mock_openai_client):
    """TC-LLM-02: Làm sạch code block ```json ``` do LLM trả về trước khi parse"""
    raw_response = """```json
    {
        "core_competencies": {"analytical_thinking": 7},
        "domain_competencies": {}
    }
    ```"""
    mock_openai_client.chat.completions.create.return_value.choices[0].message.content = raw_response
    
    with patch("processors.llm_extractor.get_llm_client", return_value=mock_openai_client):
        res = extract_competencies_from_jd("Backend Engineer", "JD text here")
        
    assert res == {
        "core_competencies": {"analytical_thinking": 7},
        "domain_competencies": {}
    }

def test_extract_json_parse_retry(mock_openai_client):
    """TC-LLM-03: Gặp lỗi parse JSON → tự động thử lại tối đa 3 lần"""
    # Lần 1 và 2 lỗi, lần 3 thành công
    mock_completions = mock_openai_client.chat.completions.create
    
    response_1 = MagicMock()
    response_1.choices = [MagicMock()]
    response_1.choices[0].message.content = "{ broken json"
    
    response_2 = MagicMock()
    response_2.choices = [MagicMock()]
    response_2.choices[0].message.content = "{ still broken"
    
    response_3 = MagicMock()
    response_3.choices = [MagicMock()]
    response_3.choices[0].message.content = '{"ok": true}'
    
    mock_completions.side_effect = [response_1, response_2, response_3]
    
    with patch("processors.llm_extractor.get_llm_client", return_value=mock_openai_client):
        res = extract_competencies_from_jd("Backend Engineer", "JD text here")
        
    assert res == {"ok": True}
    assert mock_completions.call_count == 3

def test_extract_api_error_retry(mock_openai_client):
    """TC-LLM-04: API ném ngoại lệ → tự động thử lại tối đa 3 lần và trả về None nếu lỗi hết"""
    mock_completions = mock_openai_client.chat.completions.create
    mock_completions.side_effect = Exception("FPT Cloud service down")
    
    with patch("processors.llm_extractor.get_llm_client", return_value=mock_openai_client):
        res = extract_competencies_from_jd("Backend Engineer", "JD text here")
        
    assert res is None
    assert mock_completions.call_count == 3
