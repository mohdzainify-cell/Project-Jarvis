from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    gemini_api_key: str = ""
    groq_api_key: str = ""
    ollama_base_url: str = "http://localhost:11434"

    # LLM model names
    gemini_model: str = "gemini/gemini-2.5-flash"
    groq_model: str = "groq/llama-3.3-70b-versatile"
    ollama_model: str = "ollama/llama3.1"

    # Auth
    voice_passphrase: str = "Jarvis online"
    password_hash: str = ""  # bcrypt hash set on first run
    recovery_passphrase: str = ""

    # Memory
    sqlite_path: str = "../data/jarvis.db"
    chroma_path: str = "../data/chroma"
    max_history: int = 50

    class Config:
        env_file = "../.env"

settings = Settings()