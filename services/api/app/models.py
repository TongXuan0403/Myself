from __future__ import annotations

from datetime import date as date_type
from typing import Literal

from pydantic import BaseModel, Field, field_validator, model_validator

Status = Literal["draft", "published"]
ProjectStatus = Literal["idea", "building", "online"]


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


class ContentUpdate(BaseModel):
    @model_validator(mode="before")
    @classmethod
    def reject_explicit_null(cls, value: object) -> object:
        if isinstance(value, dict) and any(item is None for item in value.values()):
            raise ValueError("Update fields cannot be null; omit unchanged fields")
        return value


class ArticleUpdate(ContentUpdate):
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


class CollectionBase(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    slug: str = Field(min_length=1, max_length=180, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str = Field(default="", max_length=500)
    audience: str = Field(default="", max_length=240)
    stages: list[str] = Field(default_factory=list, max_length=30)
    done: int = Field(default=0, ge=0)

    @field_validator("title", "description", "audience", mode="before")
    @classmethod
    def strip_collection_strings(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value

    @field_validator("slug", mode="before")
    @classmethod
    def normalize_collection_slug(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower().replace(" ", "-")
        return value

    @field_validator("stages", mode="before")
    @classmethod
    def normalize_stages(cls, value: object) -> object:
        if not isinstance(value, list):
            return value
        return [item.strip() for item in value if isinstance(item, str) and item.strip()]


class CollectionCreate(CollectionBase):
    pass


class CollectionUpdate(ContentUpdate):
    title: str | None = Field(default=None, min_length=1, max_length=180)
    slug: str | None = Field(default=None, min_length=1, max_length=180, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    description: str | None = Field(default=None, max_length=500)
    audience: str | None = Field(default=None, max_length=240)
    stages: list[str] | None = Field(default=None, max_length=30)
    done: int | None = Field(default=None, ge=0)

    @field_validator("title", "description", "audience", mode="before")
    @classmethod
    def strip_optional_collection_strings(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value

    @field_validator("slug", mode="before")
    @classmethod
    def normalize_optional_collection_slug(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower().replace(" ", "-")
        return value

    @field_validator("stages", mode="before")
    @classmethod
    def normalize_optional_stages(cls, value: object) -> object:
        if not isinstance(value, list):
            return value
        return [item.strip() for item in value if isinstance(item, str) and item.strip()]


class Collection(CollectionBase):
    id: int
    created_at: str
    updated_at: str


class ProjectBase(BaseModel):
    name: str = Field(min_length=1, max_length=180)
    slug: str = Field(min_length=1, max_length=180, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    summary: str = Field(default="", max_length=500)
    status: ProjectStatus = "idea"
    stack: list[str] = Field(default_factory=list, max_length=30)
    result: str = Field(default="", max_length=500)
    link: str = Field(default="", max_length=300)

    @field_validator("name", "summary", "result", "link", mode="before")
    @classmethod
    def strip_project_strings(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value

    @field_validator("slug", mode="before")
    @classmethod
    def normalize_project_slug(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower().replace(" ", "-")
        return value

    @field_validator("stack", mode="before")
    @classmethod
    def normalize_stack(cls, value: object) -> object:
        if not isinstance(value, list):
            return value
        return [item.strip() for item in value if isinstance(item, str) and item.strip()]


class ProjectCreate(ProjectBase):
    pass


class ProjectUpdate(ContentUpdate):
    name: str | None = Field(default=None, min_length=1, max_length=180)
    slug: str | None = Field(default=None, min_length=1, max_length=180, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")
    summary: str | None = Field(default=None, max_length=500)
    status: ProjectStatus | None = None
    stack: list[str] | None = Field(default=None, max_length=30)
    result: str | None = Field(default=None, max_length=500)
    link: str | None = Field(default=None, max_length=300)

    @field_validator("name", "summary", "result", "link", mode="before")
    @classmethod
    def strip_optional_project_strings(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value

    @field_validator("slug", mode="before")
    @classmethod
    def normalize_optional_project_slug(cls, value: object) -> object:
        if isinstance(value, str):
            return value.strip().lower().replace(" ", "-")
        return value

    @field_validator("stack", mode="before")
    @classmethod
    def normalize_optional_stack(cls, value: object) -> object:
        if not isinstance(value, list):
            return value
        return [item.strip() for item in value if isinstance(item, str) and item.strip()]


class Project(ProjectBase):
    id: int
    created_at: str
    updated_at: str


class NoteBase(BaseModel):
    date: date_type
    type: str = Field(min_length=1, max_length=40)
    title: str = Field(min_length=1, max_length=180)
    summary: str = Field(default="", max_length=500)
    tags: list[str] = Field(default_factory=list, max_length=20)

    @field_validator("type", "title", "summary", mode="before")
    @classmethod
    def strip_note_strings(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_tags(cls, value: object) -> object:
        if not isinstance(value, list):
            return value
        return [item.strip() for item in value if isinstance(item, str) and item.strip()]


class NoteCreate(NoteBase):
    pass


class NoteUpdate(ContentUpdate):
    date: date_type | None = None
    type: str | None = Field(default=None, min_length=1, max_length=40)
    title: str | None = Field(default=None, min_length=1, max_length=180)
    summary: str | None = Field(default=None, max_length=500)
    tags: list[str] | None = Field(default=None, max_length=20)

    @field_validator("type", "title", "summary", mode="before")
    @classmethod
    def strip_optional_note_strings(cls, value: object) -> object:
        return value.strip() if isinstance(value, str) else value

    @field_validator("tags", mode="before")
    @classmethod
    def normalize_optional_tags(cls, value: object) -> object:
        if not isinstance(value, list):
            return value
        return [item.strip() for item in value if isinstance(item, str) and item.strip()]


class Note(NoteBase):
    id: int
    created_at: str
    updated_at: str
