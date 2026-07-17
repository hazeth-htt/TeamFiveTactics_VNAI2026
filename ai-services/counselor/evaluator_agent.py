import json
import re
from config import client, LLM_MODEL
from prompts import EVALUATOR_SYSTEM_PROMPT

def evaluate_profile(conversation_history: list, latest_message: str) -> dict:
    # Default fallback data if API key is not set or call fails
    default_response = {
        "trait_scores": {
            "practical_skill": 5,
            "academic_interest": 5,
            "social_interaction": 5,
            "analytical_thinking": 5
        },
        "confidence_scores": {
            "practical_skill": 0.1,
            "academic_interest": 0.1,
            "social_interaction": 0.1,
            "analytical_thinking": 0.1
        },
        "is_ready": False
    }

    if not client:
        # If no client, trigger is_ready after 6 turns for demo purposes
        if len(conversation_history) >= 6:
            default_response["is_ready"] = True
            default_response["trait_scores"] = {
                "practical_skill": 8,
                "academic_interest": 3,
                "social_interaction": 5,
                "analytical_thinking": 7
            }
        return default_response

    try:
        # Build chat transcript to analyze
        transcript = ""
        for msg in conversation_history:
            transcript += f"{msg['role']}: {msg['content']}\n"
        transcript += f"user: {latest_message}\n"

        messages = [
            {"role": "system", "content": EVALUATOR_SYSTEM_PROMPT},
            {"role": "user", "content": f"Hãy phân tích lịch sử hội thoại sau và trả về điểm số:\n\n{transcript}"}
        ]

        # Call LLM with JSON format constraints
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=messages,
            temperature=0.1, # Low temperature for consistent scoring
            response_format={"type": "json_object"}
        )

        content = response.choices[0].message.content.strip()
        
        # Clean potential markdown JSON wraps (just in case)
        if content.startswith("```"):
            content = re.sub(r"^```json\s*", "", content)
            content = re.sub(r"\s*```$", "", content)
            
        parsed_json = json.loads(content)
        
        # Validate that the parsed JSON has required fields
        if "trait_scores" in parsed_json and "confidence_scores" in parsed_json:
            return parsed_json
            
        return default_response
    except Exception as e:
        print(f"Error calling LLM or parsing JSON in evaluator_agent: {e}")
        return default_response
