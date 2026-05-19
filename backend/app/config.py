from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    jwt_secret: str = "dev-secret-change-in-production"
    jwt_expiry_hours: int = 24

    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "us-east-1"
    s3_bucket: str = "rewardlens-uploads"

    openai_api_key: str = ""

    database_url: str = "sqlite:///./rewardlens.db"

    allowed_origins: str = "http://localhost:5173,http://localhost:4173"

    @property
    def origins_list(self) -> list[str]:
        return [o.strip() for o in self.allowed_origins.split(",")]


settings = Settings()
