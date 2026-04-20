"""OpenRouter API client for making LLM requests."""

import httpx
from typing import List, Dict, Any, Optional
from langfuse import observe, Langfuse
from .config import OPENROUTER_API_KEY, OPENROUTER_API_URL

langfuse_client = Langfuse()

@observe(as_type="generation")
async def query_model(
    model: str,
    messages: List[Dict[str, str]],
    timeout: float = 120.0,
    api_key: str = None
) -> Optional[Dict[str, Any]]:
    """
    Query a single model via OpenRouter API.
    """
    effective_key = api_key if api_key else OPENROUTER_API_KEY
    headers = {
        "Authorization": f"Bearer {effective_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "https://llmcouncil.example.com",
        "X-Title": "LLM Council",
    }

    payload = {
        "model": model,
        "messages": messages,
    }

    try:
        async with httpx.AsyncClient(timeout=timeout) as client:
            response = await client.post(
                OPENROUTER_API_URL,
                headers=headers,
                json=payload
            )
            response.raise_for_status()

            data = response.json()
            message = data['choices'][0]['message']
            content = message.get('content')
            
            try:
                langfuse_client.update_current_generation(
                    model=model,
                    usage_details={
                        "input": data.get("usage", {}).get("prompt_tokens", 0),
                        "output": data.get("usage", {}).get("completion_tokens", 0),
                        "total": data.get("usage", {}).get("total_tokens", 0),
                    }
                )
            except Exception as e:
                pass

            return {
                'content': content,
                'reasoning_details': message.get('reasoning_details')
            }

    except httpx.HTTPStatusError as e:
        error_text = ""
        try:
            error_text = e.response.text
        except Exception:
            pass
        print(f"HTTP error querying model {model}: {e}. Body: {error_text}", flush=True)
        try:
            langfuse_client.update_current_generation(level="ERROR", status_message=str(e), model=model)
        except Exception:
            pass
        return None
    except Exception as e:
        print(f"Error querying model {model}: {e}", flush=True)
        try:
            langfuse_client.update_current_generation(level="ERROR", status_message=str(e), model=model)
        except Exception:
            pass
        return None

@observe()
async def query_models_parallel(
    models: List[str],
    messages: List[Dict[str, str]],
    api_key: str = None
) -> Dict[str, Optional[Dict[str, Any]]]:
    import asyncio
    tasks = [query_model(model, messages, api_key=api_key) for model in models]
    responses = await asyncio.gather(*tasks)
    return {model: response for model, response in zip(models, responses)}
