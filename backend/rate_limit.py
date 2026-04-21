import json
import os
from .config import DATA_DIR
from .user_settings import get_user_settings

RATE_LIMIT_FILE = os.path.join(DATA_DIR, "rate_limits.json")

def load_limits():
    if not os.path.exists(RATE_LIMIT_FILE):
        return {"users": {}, "ips": {}}
    try:
        with open(RATE_LIMIT_FILE, "r") as f:
            return json.load(f)
    except Exception:
        return {"users": {}, "ips": {}}

def save_limits(limits):
    os.makedirs(os.path.dirname(RATE_LIMIT_FILE), exist_ok=True)
    with open(RATE_LIMIT_FILE, "w") as f:
        json.dump(limits, f)

def check_and_increment_limit(user_id: str, ip_address: str) -> bool:
    """
    Returns True if allowed (under limit or has own key), False if limit reached.
    """
    settings = get_user_settings(user_id)
    # If they have their own API key set, no limit applies
    if settings.api_key and settings.api_key.strip():
        return True
        
    limits = load_limits()
    
    user_uses = limits["users"].get(user_id, 0)
    ip_uses = limits["ips"].get(ip_address, 0)
    
    # 3 free councils allowed
    if user_uses >= 3 or ip_uses >= 3:
        return False
        
    # Increment usage and save
    limits["users"][user_id] = user_uses + 1
    limits["ips"][ip_address] = ip_uses + 1
    save_limits(limits)
    
    return True
