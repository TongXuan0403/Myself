from __future__ import annotations

from typing import Literal

from pydantic import BaseModel, Field, field_validator

Status = Literal["draft", "published"]


class ArticleBase(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    slug: str = Field(min_length=1, max_length=180, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    category: str = Field(min_length=1, max_length=40)
    excerpt: str = Field(default="", max_length=300)
    content: str = ""

    @field_validator("title", "category", "excerpt", mode="before")
    @classmethod
    def strip_strings(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("slug", mode="before")
    @classmethod
    def normalize_slug(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower().replace(" ", "-")
        return value


class ArticleCreate(ArticleBase):
    status: Status = "draft"


class ArticleUpdate(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    slug: str | None = Field(default=None, min_length=1, max_length=180, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    category: str | None = Field(default=None, min_length=1, max_length=40)
    status: Status | None = None
    excerpt: str | None = Field(default=None, max_length=300)
    content: str | None = None

    @field_validator("title", "slug", "category", "excerpt", mode="before")
    @classmethod
    def strip_strings(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip()
        return value

    @field_validator("slug", mode="before")
    @classmethod
    def normalize_slug(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower().replace(" ", "-")
        return value


class ArticleStatusUpdate(BaseModel):
    status: Status


class Article(BaseModel):
    id: int
    title: str
    slug: str
    category: str
    status: Status
    excerpt: str
    content: str
    created_at: str
    updated_at: str
    published_at: str | None = None
    word_count: int
    reading_time_minutes: int


class DashboardSummary(BaseModel):
    total_articles: int
    published_articles: int
    draft_articles: int
    latest_articles: list[Article]
