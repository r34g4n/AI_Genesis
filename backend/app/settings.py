
from pydantic import Field, PostgresDsn
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_uri: PostgresDsn | None = Field(default="postgresql://postgres:postgres@db:5432/postgres", validation_alias="DATABASE_URI")


settings = Settings()
