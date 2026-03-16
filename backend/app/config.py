from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://..."
    SUPABASE_URL: str = ""
    SUPABASE_KEY: str = ""
    ANTHROPIC_API_KEY: str = ""
    SEPOLIA_RPC_URL: str = "https://rpc.sepolia.org"
    SEPOLIA_PRIVATE_KEY: str = ""  # hex, with 0x prefix
    REDIS_URL: str = ""

    class Config:
        env_file = ".env"


settings = Settings()
