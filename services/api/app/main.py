from datetime import datetime, timezone
from pathlib import Path
import sqlite3
from typing import Literal

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

Status = Literal["draft", "published"]


class Article(BaseModel):
    id: int
    title: str = Field(min_length=1, max_length=180)
    slug: str = Field(min_length=1, max_length=180)
    category: str = Field(min_length=1, max_length=40)
    status: Status = "draft"
    excerpt: str = Field(default="", max_length=300)
    content: str = ""
    updated_at: str


class ArticleInput(BaseModel):
    title: str = Field(min_length=1, max_length=180)
    slug: str = Field(min_length=1, max_length=180)
    category: str = Field(min_length=1, max_length=40)
    status: Status = "draft"
    excerpt: str = Field(default="", max_length=300)
    content: str = ""


app = FastAPI(title="Myself Blog Publishing API", version="0.1.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173", "http://localhost:4321"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

DATABASE_PATH = Path(__file__).resolve().parents[1] / ".data" / "articles.db"
SEED_ARTICLE = {
    "title": "从零实现一个个人博客",
    "slug": "build-personal-blog",
    "category": "项目实战",
    "status": "published",
    "excerpt": "记录博客从设计到部署的过程。",
    "content": "# 从零实现一个个人博客\n\n记录实现过程。",
}


def now() -> str:
    return datetime.now(timezone.utc).isoformat()


def connect() -> sqlite3.Connection:
    DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
    connection = sqlite3.connect(DATABASE_PATH)
    connection.row_factory = sqlite3.Row
    return connection


def initialize_database() -> None:
    with connect() as connection:
        connection.execute(
            """
            CREATE TABLE IF NOT EXISTS articles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                slug TEXT NOT NULL UNIQUE,
                category TEXT NOT NULL,
                status TEXT NOT NULL CHECK (status IN ('draft', 'published')),
                excerpt TEXT NOT NULL DEFAULT '',
                content TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL
            )
            """
        )
        if connection.execute("SELECT 1 FROM articles LIMIT 1").fetchone() is None:
            connection.execute(
                """
                INSERT INTO articles (title, slug, category, status, excerpt, content, updated_at)
                VALUES (:title, :slug, :category, :status, :excerpt, :content, :updated_at)
                """,
                {**SEED_ARTICLE, "updated_at": now()},
            )


def to_article(row: sqlite3.Row) -> Article:
    return Article(**dict(row))


initialize_database()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "publishing-api"}


@app.get("/api/articles", response_model=list[Article])
def list_articles() -> list[Article]:
    with connect() as connection:
        rows = connection.execute("SELECT * FROM articles ORDER BY updated_at DESC").fetchall()
    return [to_article(row) for row in rows]


@app.post("/api/articles", response_model=Article, status_code=201)
def create_article(payload: ArticleInput) -> Article:
    values = {**payload.model_dump(), "updated_at": now()}
    try:
        with connect() as connection:
            cursor = connection.execute(
                """
                INSERT INTO articles (title, slug, category, status, excerpt, content, updated_at)
                VALUES (:title, :slug, :category, :status, :excerpt, :content, :updated_at)
                """,
                values,
            )
            article_id = cursor.lastrowid
    except sqlite3.IntegrityError as error:
        raise HTTPException(status_code=409, detail="Article slug already exists") from error
    return Article(id=article_id, **values)


@app.put("/api/articles/{article_id}", response_model=Article)
def update_article(article_id: int, payload: ArticleInput) -> Article:
    values = {**payload.model_dump(), "updated_at": now(), "id": article_id}
    try:
        with connect() as connection:
            result = connection.execute(
                """
                UPDATE articles
                SET title = :title, slug = :slug, category = :category, status = :status,
                    excerpt = :excerpt, content = :content, updated_at = :updated_at
                WHERE id = :id
                """,
                values,
            )
            if result.rowcount == 0:
                raise HTTPException(status_code=404, detail="Article not found")
    except sqlite3.IntegrityError as error:
        raise HTTPException(status_code=409, detail="Article slug already exists") from error
    return Article(**values)


@app.delete("/api/articles/{article_id}", status_code=204)
def delete_article(article_id: int) -> None:
    with connect() as connection:
        result = connection.execute("DELETE FROM articles WHERE id = ?", (article_id,))
        if result.rowcount == 0:
            raise HTTPException(status_code=404, detail="Article not found")
