import os
import json
from datetime import datetime
from typing import Any

def save_json_log(category: str, filename_prefix: str, data: Any):
    """
    Saves a JSON log file under the 'logs/<category>/' folder in market-pipeline.
    
    Args:
        category: Subfolder name (e.g. 'llm_calls', 'pinecone_upsert')
        filename_prefix: Prefix for filename (e.g. career_track_name)
        data: Dict or list to write to file
    """
    try:
        # Base folder is market-pipeline root directory
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        log_dir = os.path.join(base_dir, "logs", category)
        os.makedirs(log_dir, exist_ok=True)
        
        # Sanitize filename prefix
        safe_prefix = "".join(c for c in filename_prefix if c.isalnum() or c in ("-", "_")).rstrip()
        if not safe_prefix:
            safe_prefix = "unknown"
            
        filename = f"{safe_prefix}.json"
        filepath = os.path.join(log_dir, filename)
        
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        print(f"   [JSON LOG] Saved data exchange packet to: {filepath}")
    except Exception as e:
        print(f"   [JSON LOG ERROR] Could not save log file: {e}")
