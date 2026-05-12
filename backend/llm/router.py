import litellm
from typing import AsyncGenerator
from datetime import datetime
import logging
import asyncio

from llm.models import MODEL_CHAIN, ModelConfig, SYSTEM_PROMPT
from config import settings

logger = logging.getLogger("JARVIS.LLM")

# Suppress litellm noise
litellm.set_verbose = False
litellm.suppress_debug_info = True


class LLMRouter:
    def __init__(self):
        self._configure_keys()
        self._last_successful: str | None = None

    def _configure_keys(self):
        """Inject API keys into litellm."""
        import os
        if settings.gemini_api_key:
            os.environ["GEMINI_API_KEY"] = settings.gemini_api_key
        if settings.groq_api_key:
            os.environ["GROQ_API_KEY"] = settings.groq_api_key

    async def stream(
        self,
        user_input: str,
        history: list[dict],
        context: list[dict],
    ) -> AsyncGenerator[tuple[str, dict], None]:
        """
        Try each model in priority order.
        Yields (text_chunk, model_meta_dict) tuples.
        Announces fallback when switching models.
        """
        messages = self._build_messages(user_input, history, context)

        for model_cfg in MODEL_CHAIN:
            try:
                logger.info(f"Attempting: {model_cfg.name}")

                # Announce switch to backup if falling back
                if (
                    self._last_successful
                    and self._last_successful != model_cfg.name
                    and not model_cfg.requires_internet
                ):
                    yield (
                        "Switching to local backup model. One moment, Sir.",
                        self._make_meta(model_cfg),
                    )

                response = await litellm.acompletion(
                    model=model_cfg.name,
                    messages=messages,
                    stream=True,
                    temperature=model_cfg.temperature,
                    max_tokens=model_cfg.max_tokens,
                    timeout=15,
                )

                meta = self._make_meta(model_cfg)
                self._last_successful = model_cfg.name

                async for chunk in response:
                    delta = chunk.choices[0].delta.content or ""
                    if delta:
                        yield delta, meta

                return  # ── success, stop chain ──

            except asyncio.TimeoutError:
                logger.warning(f"{model_cfg.name} timed out. Trying next...")
                continue

            except litellm.exceptions.AuthenticationError:
                logger.warning(f"{model_cfg.name} auth failed (bad API key?). Trying next...")
                continue

            except litellm.exceptions.RateLimitError:
                logger.warning(f"{model_cfg.name} rate limited. Trying next...")
                continue

            except litellm.exceptions.ServiceUnavailableError:
                logger.warning(f"{model_cfg.name} service unavailable. Trying next...")
                continue

            except Exception as e:
                logger.warning(f"{model_cfg.name} failed: {type(e).__name__}: {e}")
                continue

        # ── All models failed ──
        raise RuntimeError(
            "I'm afraid all available models have failed to respond, Sir. "
            "Please check your internet connection and API keys."
        )

    def _make_meta(self, model_cfg: ModelConfig) -> dict:
        return {
            "provider": model_cfg.provider,
            "model":    model_cfg.display_name,
        }

    def _build_messages(
        self,
        user_input: str,
        history: list[dict],
        context: list[dict],
    ) -> list[dict]:
        now = datetime.now()
        time_str = now.strftime("%A, %d %B %Y at %H:%M")

        # Inject current time into system prompt
        system = (
            SYSTEM_PROMPT
            + f"\n\nCurrent date and time: {time_str}."
        )

        messages: list[dict] = [{"role": "system", "content": system}]

        # Inject relevant memory context
        if context:
            ctx_text = "\n---\n".join(
                c.get("document", "") for c in context if c.get("document")
            )
            if ctx_text.strip():
                messages.append({
                    "role": "system",
                    "content": f"Relevant context from memory:\n{ctx_text}",
                })

        # Inject conversation history
        for msg in history[-20:]:
            role = msg.get("role", "user")
            content = msg.get("content", "")
            if role in ("user", "assistant") and content:
                messages.append({"role": role, "content": content})

        # Current user message
        messages.append({"role": "user", "content": user_input})

        return messages