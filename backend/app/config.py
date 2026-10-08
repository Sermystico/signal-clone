from pydantic_settings import BaseSettings

# Load application settings from the environment or .env file
class Settings(BaseSettings):
    secret_key: str

    class Config:
        env_file = ".env"

settings = Settings()
