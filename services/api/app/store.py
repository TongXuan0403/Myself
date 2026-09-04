from __future__ import annotations

import math
import re
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from .models import Article, ArticleCreate, ArticleUpdate, DashboardSummary, Status

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
                created_at TEXT NOT NULL DEFAULT '',
                updated_at TEXT NOT NULL,
                published_at TEXT,
                word_count INTEGER NOT NULL DEFAULT 0,
                reading_time_minutes INTEGER NOT NULL DEFAULT 1
            )
            """
        )
        _migrate_schema(connection)
        if connection.execute("SELECT 1 FROM articles LIMIT 1").fetchone() is None:
            create_article(
                ArticleCreate(**SEED_ARTICLE),
                connection=connection,
                seed_created_at=now(),
            )


def _existing_columns(connection: sqlite3.Connection) -> set[str]:
    rows = connection.execute("PRAGMA table_info(articles)").fetchall()
    return {row["name"] for row in rows}


def _migrate_schema(connection: sqlite3.Connection) -> None:
    existing = _existing_columns(connection)
    migrations: Iterable[tuple[str, str]] = (
        ("created_at", "ALTER TABLE articles ADD COLUMN created_at TEXT NOT NULL DEFAULT ''"),
        ("published_at", "ALTER TABLE articles ADD COLUMN published_at TEXT"),
        ("word_count", "ALTER TABLE articles ADD COLUMN word_count INTEGER NOT NULL DEFAULT 0"),
        ("reading_time_minutes", "ALTER TABLE articles ADD COLUMN reading_time_minutes INTEGER NOT NULL DEFAULT 1"),
    )
    for column, statement in migrations:
        if column not in existing:
            connection.execute(statement)
    connection.execute(
        """
        UPDATE articles
        SET created_at = CASE
            WHEN created_at IS NULL OR created_at = '' THEN updated_at
            ELSE created_at
        END
        """
    )
    connection.execute(
        """
        UPDATE articles
        SET published_at = CASE
            WHEN status = 'published' AND (published_at IS NULL OR published_at = '') THEN updated_at
            ELSE published_at
        END
        """
    )
    connection.execute(
        """
        UPDATE articles
        SET word_count = CASE
            WHEN word_count IS NULL OR word_count <= 0 THEN LENGTH(REPLACE(TRIM(content), ' ', ''))
            ELSE word_count
        END
        """
    )
    connection.execute(
        """
        UPDATE articles
        SET reading_time_minutes = CASE
            WHEN reading_time_minutes IS NULL OR reading_time_minutes <= 0 THEN MAX(1, CAST(ROUND(word_count / 220.0) AS INTEGER))
            ELSE reading_time_minutes
        END
        """
    )
    connection.execute("CREATE INDEX IF NOT EXISTS idx_articles_status_updated_at ON articles(status, updated_at DESC)")
    connection.execute("CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug)")


def sanitize_excerpt(excerpt: str, content: str) -> str:
    cleaned = excerpt.strip()
    if cleaned:
        return cleaned
    summary = re.sub(r"\s+", " ", content).strip()
    if not summary:
        return ""
    return summary[:160].rstrip("，。；：,.;:!? ")


def count_words(content: str) -> int:
    latin_words = re.findall(r"[A-Za-z0-9_']+", content)
    cjk_chars = re.findall(r"[\u4e00-\u9fff]", content)
    mixed_words = re.findall(r"[\u3040-\u30ff\uac00-\ud7af]", content)
    estimate = len(latin_words) + math.ceil((len(cjk_chars) + len(mixed_words)) / 2)
    return max(1, estimate)


def reading_time_minutes(word_count: int) -> int:
    return max(1, math.ceil(word_count / 220))


def build_article_values(payload: ArticleCreate | ArticleUpdate, existing: dict[str, object] | None = None) -> dict[str, object]:
    if isinstance(payload, ArticleCreate):
        incoming = payload.model_dump()
    else:
        incoming = payload.model_dump(exclude_unset=True)
    values = dict(existing or {})
    values.update(incoming)
    if "slug" in values and isinstance(values["slug"], str):
        values["slug"] = values["slug"].strip().lower().replace(" ", "-")
    if "title" in values and isinstance(values["title"], str):
        values["title"] = values["title"].strip()
    if "category" in values and isinstance(values["category"], str):
        values["category"] = values["category"].strip()
    if "excerpt" in values and isinstance(values["excerpt"], str):
        values["excerpt"] = sanitize_excerpt(values["excerpt"], values.get("content", "") or "")
    if "content" in values and isinstance(values["content"], str):
        values["content"] = values["content"]
    values["word_count"] = count_words(values.get("content", "") or "")
    values["reading_time_minutes"] = reading_time_minutes(values["word_count"])
    return values


def row_to_article(row: sqlite3.Row) -> Article:
    data = dict(row)
    data.setdefault("created_at", data.get("updated_at", now()))
    data.setdefault("published_at", None)
    if not data.get("word_count"):
        data["word_count"] = count_words(data.get("content", "") or "")
    if not data.get("reading_time_minutes"):
        data["reading_time_minutes"] = reading_time_minutes(int(data["word_count"]))
    return Article(**data)


def fetch_article(article_id: int, *, connection: sqlite3.Connection | None = None) -> Article:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        row = connection.execute("SELECT * FROM articles WHERE id = ?", (article_id,)).fetchone()
        if row is None:
            raise LookupError("Article not found")
        return row_to_article(row)
    finally:
        if owns_connection:
            connection.close()


def fetch_article_by_slug(slug: str, *, connection: sqlite3.Connection | None = None) -> Article:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        row = connection.execute("SELECT * FROM articles WHERE slug = ?", (slug,)).fetchone()
        if row is None:
            raise LookupError("Article not found")
        return row_to_article(row)
    finally:
        if owns_connection:
            connection.close()


def list_articles(
    *,
    status: Status | None = None,
    query: str | None = None,
    limit: int = 50,
    offset: int = 0,
    connection: sqlite3.Connection | None = None,
) -> list[Article]:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        sql = ["SELECT * FROM articles"]
        clauses: list[str] = []
        params: dict[str, object] = {"limit": limit, "offset": offset}
        if status is not None:
            clauses.append("status = :status")
            params["status"] = status
        if query:
            clauses.append(
                "(title LIKE :query OR slug LIKE :query OR category LIKE :query OR excerpt LIKE :query OR content LIKE :query)"
            )
            params["query"] = f"%{query.strip()}%"
        if clauses:
            sql.append(" WHERE " + " AND ".join(clauses))
        sql.append(" ORDER BY updated_at DESC, id DESC LIMIT :limit OFFSET :offset")
        rows = connection.execute("".join(sql), params).fetchall()
        return [row_to_article(row) for row in rows]
    finally:
        if owns_connection:
            connection.close()


def create_article(
    payload: ArticleCreate,
    *,
    connection: sqlite3.Connection | None = None,
    seed_created_at: str | None = None,
) -> Article:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        values = build_article_values(payload)
        timestamp = seed_created_at or now()
        values["created_at"] = timestamp
        values["updated_at"] = timestamp
        if values.get("status") == "published":
            values["published_at"] = timestamp
        else:
            values["published_at"] = None
        cursor = connection.execute(
            """
            INSERT INTO articles (
                title, slug, category, status, excerpt, content,
                created_at, updated_at, published_at, word_count, reading_time_minutes
            )
            VALUES (:title, :slug, :category, :status, :excerpt, :content,
                    :created_at, :updated_at, :published_at, :word_count, :reading_time_minutes)
            """,
            values,
        )
        article_id = cursor.lastrowid
        connection.commit()
        return fetch_article(article_id, connection=connection)
    except sqlite3.IntegrityError as error:
        connection.rollback()
        raise ValueError("Article slug already exists") from error
    finally:
        if owns_connection:
            connection.close()


def update_article(article_id: int, payload: ArticleUpdate, *, connection: sqlite3.Connection | None = None) -> Article:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        existing_row = connection.execute("SELECT * FROM articles WHERE id = ?", (article_id,)).fetchone()
        if existing_row is None:
            raise LookupError("Article not found")
        existing = dict(existing_row)
        values = build_article_values(payload, existing)
        values["updated_at"] = now()
        if values.get("status") == "published" and not values.get("published_at"):
            values["published_at"] = values["updated_at"]
        if values.get("status") == "draft" and existing.get("published_at"):
            values["published_at"] = existing.get("published_at")
        connection.execute(
            """
            UPDATE articles
            SET title = :title,
                slug = :slug,
                category = :category,
                status = :status,
                excerpt = :excerpt,
                content = :content,
                updated_at = :updated_at,
                published_at = :published_at,
                word_count = :word_count,
                reading_time_minutes = :reading_time_minutes
            WHERE id = :id
            """,
            {**values, "id": article_id},
        )
        connection.commit()
        return fetch_article(article_id, connection=connection)
    except sqlite3.IntegrityError as error:
        connection.rollback()
        raise ValueError("Article slug already exists") from error
    finally:
        if owns_connection:
            connection.close()


def set_article_status(article_id: int, status: Status, *, connection: sqlite3.Connection | None = None) -> Article:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        existing = fetch_article(article_id, connection=connection)
        update_payload = ArticleUpdate(status=status)
        values = build_article_values(update_payload, existing.model_dump())
        values["updated_at"] = now()
        if status == "published":
            values["published_at"] = existing.published_at or values["updated_at"]
        else:
            values["published_at"] = existing.published_at
        connection.execute(
            """
            UPDATE articles
            SET status = :status,
                updated_at = :updated_at,
                published_at = :published_at,
                word_count = :word_count,
                reading_time_minutes = :reading_time_minutes
            WHERE id = :id
            """,
            {
                "id": article_id,
                "status": status,
                "updated_at": values["updated_at"],
                "published_at": values["published_at"],
                "word_count": values["word_count"],
                "reading_time_minutes": values["reading_time_minutes"],
            },
        )
        connection.commit()
        return fetch_article(article_id, connection=connection)
    finally:
        if owns_connection:
            connection.close()


def delete_article(article_id: int, *, connection: sqlite3.Connection | None = None) -> None:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        result = connection.execute("DELETE FROM articles WHERE id = ?", (article_id,))
        if result.rowcount == 0:
            raise LookupError("Article not found")
        connection.commit()
    finally:
        if owns_connection:
            connection.close()


def dashboard_summary(*, connection: sqlite3.Connection | None = None) -> DashboardSummary:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        total_articles = connection.execute("SELECT COUNT(*) FROM articles").fetchone()[0]
        published_articles = connection.execute("SELECT COUNT(*) FROM articles WHERE status = 'published'").fetchone()[0]
        draft_articles = connection.execute("SELECT COUNT(*) FROM articles WHERE status = 'draft'").fetchone()[0]
        latest_articles = list_articles(limit=5, connection=connection)
        return DashboardSummary(
            total_articles=total_articles,
            published_articles=published_articles,
            draft_articles=draft_articles,
            latest_articles=latest_articles,
        )
    finally:
        if owns_connection:
            connection.close()
