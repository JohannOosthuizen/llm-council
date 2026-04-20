"""Configuration for the LLM Council."""

import os
from dotenv import load_dotenv

load_dotenv()

# OpenRouter API key
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

# Council members - list of OpenRouter model identifiers
COUNCIL_MODELS = [
    "openai/gpt-4o-mini",
    "google/gemini-2.5-flash",
    "anthropic/claude-3-haiku",
    "meta-llama/llama-3.1-8b-instruct",
]

# Chairman model - synthesizes final response
CHAIRMAN_MODEL = "openai/gpt-4o"

# OpenRouter API endpoint
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Data directory for conversation storage
DATA_DIR = "data/conversations"

# Langfuse Configuration
os.environ["LANGFUSE_SECRET_KEY"] = "sk-lf-f9291fd7-e5d5-4d4f-80e3-cad9fd0cf3d8"
os.environ["LANGFUSE_PUBLIC_KEY"] = "pk-lf-821d6dc3-2cb3-4ef3-823d-91d5888a93e1"
os.environ["LANGFUSE_HOST"] = "https://langfuse.teachablemachine.co.za"

# Settings directory
SETTINGS_DIR = "data/settings"
