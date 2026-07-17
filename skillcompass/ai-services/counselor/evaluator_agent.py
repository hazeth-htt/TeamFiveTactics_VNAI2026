import config
import json
from prompts import EVALUATOR_SYSTEM_PROMPT

def build_dynamic_evaluator_prompt(traits_to_evaluate: dict) -> str:
    traits_desc = ""
    default_traits_json = {}
    default_confidence_json = {}
    
    for key, desc in traits_to_evaluate.items():
        traits_desc += f"- {key}: {desc}\n"
        default_traits_json[key] = 5
        default_confidence_json[key] = 0.0

    prompt = EVALUATOR_SYSTEM_PROMPT.format(
        traits_desc=traits_desc,
        default_traits_json=json.dumps(default_traits_json),
        default_confidence_json=json.dumps(default_confidence_json)
    )
    return prompt

def evaluate_profile(conversation_history: list, latest_message: str, evaluation_framework: dict) -> dict:
    # Extract traits from updated evaluation_framework
    traits = evaluation_framework.get("traits_to_evaluate", {})
    if not isinstance(traits, dict):
        traits = {}

    # Build dynamic default response based on framework keys
    default_traits = {k: 5 for k in traits.keys()}
    default_confidence = {k: 0.1 for k in traits.keys()}
    
    default_response = {
        "context_inferred": "highschool",
        "trait_scores": default_traits,
        "confidence_scores": default_confidence,
        "market_expectations": {
            "preferred_locations": [],
            "expected_salary_min": 0,
            "willing_to_relocate": False
        },
        "is_ready": False
    }

    # Simulate responses for testing if LLM key is placeholder
    if not config.LLM_API_KEY or config.LLM_API_KEY == "placeholder_replace_me":
        user_turns = sum(1 for m in conversation_history if m.get('role') == 'user') + 1
        if user_turns >= 6:
            default_response["is_ready"] = True
            default_response["trait_scores"] = {k: 8 if i % 2 == 0 else 4 for i, k in enumerate(traits.keys())}
            default_response["confidence_scores"] = {k: 0.85 for k in traits.keys()}
            default_response["market_expectations"] = {
                "preferred_locations": ["Hà Nội"],
                "expected_salary_min": 15000000,
                "willing_to_relocate": True
            }
        return default_response

    try:
        # Build chat transcript to analyze
        transcript = ""
        for msg in conversation_history:
            transcript += f"{msg['role']}: {msg['content']}\n"
        transcript += f"user: {latest_message}\n"

        system_instruction = build_dynamic_evaluator_prompt(traits)
        
        # Call LLM with JSON response format enabled
        response_text = config.call_llm(
            system_instruction=system_instruction,
            messages=[{"role": "user", "content": f"Hãy phân tích lịch sử hội thoại sau và chấm điểm:\n\n{transcript}"}],
            response_json=True,
            temperature=0.1
        )

        parsed_json = json.loads(response_text)
        
        # Sanitize and validate keys/types returned by LLM
        if "trait_scores" not in parsed_json:
            parsed_json["trait_scores"] = default_traits
        if "confidence_scores" not in parsed_json:
            parsed_json["confidence_scores"] = default_confidence
        if "market_expectations" not in parsed_json:
            parsed_json["market_expectations"] = default_response["market_expectations"]
            
        clean_traits = {}
        clean_confidence = {}
        for k in traits.keys():
            # Validate traits score is int (1-10)
            score = parsed_json["trait_scores"].get(k, 5)
            try:
                score = int(score)
                if not (1 <= score <= 10):
                    score = 5
            except (ValueError, TypeError):
                score = 5
            clean_traits[k] = score
            
            # Validate confidence score is float (0.0-1.0)
            conf = parsed_json["confidence_scores"].get(k, 0.0)
            try:
                conf = float(conf)
                if not (0.0 <= conf <= 1.0):
                    conf = 0.0
            except (ValueError, TypeError):
                conf = 0.0
            clean_confidence[k] = conf
            
        parsed_json["trait_scores"] = clean_traits
        parsed_json["confidence_scores"] = clean_confidence

        # Clean market expectations
        me = parsed_json.get("market_expectations", {})
        if not isinstance(me, dict):
            me = {}
            
        preferred_locations = me.get("preferred_locations", [])
        if not isinstance(preferred_locations, list):
            preferred_locations = [preferred_locations] if preferred_locations else []
        preferred_locations = [str(loc).strip() for loc in preferred_locations if loc]
        
        expected_salary_min = me.get("expected_salary_min", 0)
        try:
            expected_salary_min = int(expected_salary_min)
        except (ValueError, TypeError):
            expected_salary_min = 0
                
        willing_to_relocate = me.get("willing_to_relocate", False)
        if isinstance(willing_to_relocate, str):
            willing_to_relocate = willing_to_relocate.lower() in ("true", "yes", "y", "1")
        else:
            willing_to_relocate = bool(willing_to_relocate)
                
        parsed_json["market_expectations"] = {
            "preferred_locations": preferred_locations,
            "expected_salary_min": expected_salary_min,
            "willing_to_relocate": willing_to_relocate
        }

        # Statically set context_inferred as highschool
        parsed_json["context_inferred"] = "highschool"

        # Calculate is_ready programmatically for high accuracy
        user_turns = sum(1 for m in conversation_history if m.get('role') == 'user') + 1
        avg_confidence = sum(clean_confidence.values()) / len(clean_confidence) if clean_confidence else 0.0
        
        is_ready_inferred = parsed_json.get("is_ready", False)
        # Force is_ready to True if average confidence > 0.8 or turns >= 15
        is_ready = is_ready_inferred or (avg_confidence >= 0.8) or (user_turns >= 15)
        parsed_json["is_ready"] = is_ready

        return parsed_json
    except Exception as e:
        print(f"Error calling LLM or parsing response in evaluator_agent: {e}")
        return default_response
