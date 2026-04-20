import json
import os
from pathlib import Path
from typing import Dict, Any, List
from pydantic import BaseModel

from .config import SETTINGS_DIR, COUNCIL_MODELS, CHAIRMAN_MODEL, OPENROUTER_API_KEY

class UserSettings(BaseModel):
    api_key: str = ""
    council_models: List[str] = COUNCIL_MODELS
    chairman_model: str = CHAIRMAN_MODEL

def ensure_settings_dir():
    Path(SETTINGS_DIR).mkdir(parents=True, exist_ok=True)

def get_settings_path(user_id: str) -> str:
    return os.path.join(SETTINGS_DIR, f"{user_id}.json")

def get_user_settings(user_id: str) -> UserSettings:
    ensure_settings_dir()
    path = get_settings_path(user_id)
    if os.path.exists(path):
        with open(path, 'r') as f:
            data = json.load(f)
            return UserSettings(
                api_key=data.get("api_key", ""),
                council_models=data.get("council_models", COUNCIL_MODELS),
                chairman_model=data.get("chairman_model", CHAIRMAN_MODEL)
            )
    return UserSettings()

def save_user_settings(user_id: str, settings: UserSettings):
    ensure_settings_dir()
    path = get_settings_path(user_id)
    with open(path, 'w') as f:
        json.dump(settings.model_dump(), f, indent=2)

def get_effective_api_key(user_id: str) -> str:
    settings = get_user_settings(user_id)
    return settings.api_key if settings.api_key else OPENROUTER_API_KEY
