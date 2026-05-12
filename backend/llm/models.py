from dataclasses import dataclass
from typing import Optional


@dataclass
class ModelConfig:
    name: str           # litellm model string e.g. "groq/llama-3.3-70b-versatile"
    provider: str       # Display name e.g. "Groq"
    display_name: str   # Display model name e.g. "Llama-3.3-70B"
    max_tokens: int
    temperature: float
    requires_internet: bool
    priority: int       # Lower = tried first


# ── Fallback chain (priority order) ──────────────────────────────────
MODEL_CHAIN: list[ModelConfig] = [
    ModelConfig(
        name="gemini/gemini-2.5-flash",
        provider="Gemini",
        display_name="Gemini 2.5 Flash",
        max_tokens=1024,
        temperature=0.7,
        requires_internet=True,
        priority=1,
    ),
    ModelConfig(
        name="groq/llama-3.3-70b-versatile",
        provider="Groq",
        display_name="Llama-3.3-70B",
        max_tokens=1024,
        temperature=0.7,
        requires_internet=True,
        priority=2,
    ),
    ModelConfig(
        name="ollama/llama3.1",
        provider="Ollama",
        display_name="Llama 3.1",
        max_tokens=1024,
        temperature=0.7,
        requires_internet=False,
        priority=3,
    ),
]

SYSTEM_PROMPT = """You are JARVIS (Just A Rather Very Intelligent System), \
the AI assistant of Tony Stark.
You are calm, highly capable, and speak with polite British wit.
Always address the user as "Sir".
You are aware of the current date and time — use it naturally in conversation.
Be concise, precise, and occasionally dry in your humour.
Never break character. Never refer to yourself as an AI language model or assistant.
When switching models or encountering issues, handle gracefully without alarming Sir unnecessarily."""