from __future__ import annotations

import math
import re
import sqlite3
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Iterable

from .models import (
    Article,
    ArticleCreate,
    ArticleUpdate,
    Collection,
    CollectionCreate,
    CollectionUpdate,
    DashboardSummary,
    Note,
    NoteCreate,
    NoteUpdate,
    Project,
    ProjectCreate,
    ProjectUpdate,
    Status,
)

DATABASE_PATH = Path(__file__).resolve().parents[1] / ".data" / "articles.db"

SEED_ARTICLE = {
    "title": "从零实现一个个人博客",
    "slug": "build-personal-blog",
    "category": "项目实战",
    "status": "published",
    "excerpt": "记录博客从设计到部署的过程。",
    "content": "# 从零实现一个个人博客\n\n记录实现过程。",
}

SEED_COLLECTIONS = [
    {
        "title": "个人博客从零实现",
        "slug": "personal-blog",
        "description": "从信息架构到自动部署，完整记录一个内容站点的构建过程。",
        "audience": "适合想做个人内容站点的开发者",
        "stages": ["技术选型", "页面设计", "Markdown 渲染", "自动部署", "性能优化"],
        "done": 3,
    },
    {
        "title": "前端界面实验室",
        "slug": "frontend-lab",
        "description": "网格、动效和可访问性相关的小型实践。",
        "audience": "适合关注体验细节的前端开发者",
        "stages": ["布局", "层级", "状态", "动效", "可访问性"],
        "done": 5,
    },
    {
        "title": "AI 工具工作流",
        "slug": "ai-workflow",
        "description": "把 AI 放进真实开发流程的记录和复盘。",
        "audience": "适合希望提高开发效率的实践者",
        "stages": ["需求拆解", "提示词设计", "代码协作", "效果复盘"],
        "done": 1,
    },
]

SEED_PROJECTS = [
    {
        "name": "Myself / Field Notes",
        "slug": "myself-field-notes",
        "summary": "兼顾自动发布和视觉表达的个人技术博客。",
        "status": "building",
        "stack": ["Astro", "React", "FastAPI"],
        "result": "公开站点和发布后台已经跑通 Mock 流程。",
        "link": "github.com/TongXuan0403/Myself",
    },
    {
        "name": "Release Desk",
        "slug": "release-desk",
        "summary": "一个为单作者设计的 Markdown 发布工作台。",
        "status": "online",
        "stack": ["TypeScript", "Vite", "SQLite"],
        "result": "支持草稿、预览、校验和发布状态反馈。",
        "link": "github.com/TongXuan0403/release-desk",
    },
    {
        "name": "Prompt Atlas",
        "slug": "prompt-atlas",
        "summary": "整理可复用的 AI 工具提示词与评测样例。",
        "status": "idea",
        "stack": ["Next.js", "OpenAI"],
        "result": "正在整理第一批真实开发任务样例。",
        "link": "github.com/TongXuan0403/prompt-atlas",
    },
]

SEED_NOTES = [
    {"date": "2026-09-04", "type": "项目进展", "title": "开始搭建发布后台", "summary": "先把登录、路由、文章编辑和发布反馈做成一条可以跑通的 Mock 流程。", "tags": ["博客", "前端"]},
    {"date": "2026-09-02", "type": "学习笔记", "title": "Astro Islands 的边界", "summary": "把交互留给需要它的组件，其余页面保持静态输出。", "tags": ["Astro", "性能"]},
    {"date": "2026-08-29", "type": "问题解决", "title": "为 Markdown 文章补齐空状态", "summary": "空状态不是错误，它应该告诉用户下一步能做什么。", "tags": ["UX", "内容"]},
    {"date": "2026-08-26", "type": "工具尝试", "title": "用 Playwright 记录关键交互", "summary": "把加载、表单校验和移动端菜单列入每次发布前的快速检查。", "tags": ["测试", "自动化"]},
]


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
        _create_content_tables(connection)
        _seed_content_tables(connection)


def _create_content_tables(connection: sqlite3.Connection) -> None:
    connection.executescript(
        """
        CREATE TABLE IF NOT EXISTS collections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            description TEXT NOT NULL DEFAULT '',
            audience TEXT NOT NULL DEFAULT '',
            stages TEXT NOT NULL DEFAULT '[]',
            done INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            slug TEXT NOT NULL UNIQUE,
            summary TEXT NOT NULL DEFAULT '',
            status TEXT NOT NULL CHECK (status IN ('idea', 'building', 'online')),
            stack TEXT NOT NULL DEFAULT '[]',
            result TEXT NOT NULL DEFAULT '',
            link TEXT NOT NULL DEFAULT '',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT NOT NULL,
            type TEXT NOT NULL,
            title TEXT NOT NULL,
            summary TEXT NOT NULL DEFAULT '',
            tags TEXT NOT NULL DEFAULT '[]',
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_collections_updated_at ON collections(updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_projects_updated_at ON projects(updated_at DESC);
        CREATE INDEX IF NOT EXISTS idx_notes_date ON notes(date DESC, id DESC);
        """
    )


def _seed_content_tables(connection: sqlite3.Connection) -> None:
    timestamp = now()
    if connection.execute("SELECT 1 FROM collections LIMIT 1").fetchone() is None:
        for item in SEED_COLLECTIONS:
            connection.execute(
                """
                INSERT INTO collections (title, slug, description, audience, stages, done, created_at, updated_at)
                VALUES (:title, :slug, :description, :audience, :stages, :done, :created_at, :updated_at)
                """,
                {**item, "stages": json.dumps(item["stages"], ensure_ascii=False), "created_at": timestamp, "updated_at": timestamp},
            )
    if connection.execute("SELECT 1 FROM projects LIMIT 1").fetchone() is None:
        for item in SEED_PROJECTS:
            connection.execute(
                """
                INSERT INTO projects (name, slug, summary, status, stack, result, link, created_at, updated_at)
                VALUES (:name, :slug, :summary, :status, :stack, :result, :link, :created_at, :updated_at)
                """,
                {**item, "stack": json.dumps(item["stack"], ensure_ascii=False), "created_at": timestamp, "updated_at": timestamp},
            )
    if connection.execute("SELECT 1 FROM notes LIMIT 1").fetchone() is None:
        for item in SEED_NOTES:
            connection.execute(
                """
                INSERT INTO notes (date, type, title, summary, tags, created_at, updated_at)
                VALUES (:date, :type, :title, :summary, :tags, :created_at, :updated_at)
                """,
                {**item, "tags": json.dumps(item["tags"], ensure_ascii=False), "created_at": timestamp, "updated_at": timestamp},
            )
    connection.commit()


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


def _decode_list(value: str) -> list[str]:
    try:
        decoded = json.loads(value)
    except (TypeError, json.JSONDecodeError):
        return []
    return decoded if isinstance(decoded, list) else []


def row_to_collection(row: sqlite3.Row) -> Collection:
    data = dict(row)
    data["stages"] = _decode_list(data.get("stages", "[]"))
    return Collection(**data)


def row_to_project(row: sqlite3.Row) -> Project:
    data = dict(row)
    data["stack"] = _decode_list(data.get("stack", "[]"))
    return Project(**data)


def row_to_note(row: sqlite3.Row) -> Note:
    data = dict(row)
    data["tags"] = _decode_list(data.get("tags", "[]"))
    return Note(**data)


def fetch_collection(collection_id: int, *, connection: sqlite3.Connection | None = None) -> Collection:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        row = connection.execute("SELECT * FROM collections WHERE id = ?", (collection_id,)).fetchone()
        if row is None:
            raise LookupError("Collection not found")
        return row_to_collection(row)
    finally:
        if owns_connection:
            connection.close()


def list_collections(*, connection: sqlite3.Connection | None = None) -> list[Collection]:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        rows = connection.execute("SELECT * FROM collections ORDER BY updated_at DESC, id DESC").fetchall()
        return [row_to_collection(row) for row in rows]
    finally:
        if owns_connection:
            connection.close()


def create_collection(payload: CollectionCreate, *, connection: sqlite3.Connection | None = None) -> Collection:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        values = payload.model_dump()
        timestamp = now()
        stages = values.get("stages", [])
        values["done"] = min(values.get("done", 0), len(stages))
        cursor = connection.execute(
            """
            INSERT INTO collections (title, slug, description, audience, stages, done, created_at, updated_at)
            VALUES (:title, :slug, :description, :audience, :stages, :done, :created_at, :updated_at)
            """,
            {**values, "stages": json.dumps(stages, ensure_ascii=False), "created_at": timestamp, "updated_at": timestamp},
        )
        connection.commit()
        return fetch_collection(cursor.lastrowid, connection=connection)
    except sqlite3.IntegrityError as error:
        connection.rollback()
        raise ValueError("Collection slug already exists") from error
    finally:
        if owns_connection:
            connection.close()


def update_collection(collection_id: int, payload: CollectionUpdate, *, connection: sqlite3.Connection | None = None) -> Collection:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        existing_row = connection.execute("SELECT * FROM collections WHERE id = ?", (collection_id,)).fetchone()
        if existing_row is None:
            raise LookupError("Collection not found")
        existing = dict(existing_row)
        existing["stages"] = _decode_list(existing.get("stages", "[]"))
        values = {**existing, **payload.model_dump(exclude_unset=True)}
        values["updated_at"] = now()
        values["done"] = min(values.get("done", 0), len(values.get("stages", [])))
        connection.execute(
            """
            UPDATE collections
            SET title = :title, slug = :slug, description = :description, audience = :audience,
                stages = :stages, done = :done, updated_at = :updated_at
            WHERE id = :id
            """,
            {**values, "stages": json.dumps(values["stages"], ensure_ascii=False), "id": collection_id},
        )
        connection.commit()
        return fetch_collection(collection_id, connection=connection)
    except sqlite3.IntegrityError as error:
        connection.rollback()
        raise ValueError("Collection slug already exists") from error
    finally:
        if owns_connection:
            connection.close()


def delete_collection(collection_id: int, *, connection: sqlite3.Connection | None = None) -> None:
    _delete_content("collections", "Collection", collection_id, connection=connection)


def fetch_project(project_id: int, *, connection: sqlite3.Connection | None = None) -> Project:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        row = connection.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        if row is None:
            raise LookupError("Project not found")
        return row_to_project(row)
    finally:
        if owns_connection:
            connection.close()


def list_projects(*, connection: sqlite3.Connection | None = None) -> list[Project]:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        rows = connection.execute("SELECT * FROM projects ORDER BY updated_at DESC, id DESC").fetchall()
        return [row_to_project(row) for row in rows]
    finally:
        if owns_connection:
            connection.close()


def create_project(payload: ProjectCreate, *, connection: sqlite3.Connection | None = None) -> Project:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        values = payload.model_dump()
        timestamp = now()
        cursor = connection.execute(
            """
            INSERT INTO projects (name, slug, summary, status, stack, result, link, created_at, updated_at)
            VALUES (:name, :slug, :summary, :status, :stack, :result, :link, :created_at, :updated_at)
            """,
            {**values, "stack": json.dumps(values.get("stack", []), ensure_ascii=False), "created_at": timestamp, "updated_at": timestamp},
        )
        connection.commit()
        return fetch_project(cursor.lastrowid, connection=connection)
    except sqlite3.IntegrityError as error:
        connection.rollback()
        raise ValueError("Project slug already exists") from error
    finally:
        if owns_connection:
            connection.close()


def update_project(project_id: int, payload: ProjectUpdate, *, connection: sqlite3.Connection | None = None) -> Project:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        existing_row = connection.execute("SELECT * FROM projects WHERE id = ?", (project_id,)).fetchone()
        if existing_row is None:
            raise LookupError("Project not found")
        existing = dict(existing_row)
        existing["stack"] = _decode_list(existing.get("stack", "[]"))
        values = {**existing, **payload.model_dump(exclude_unset=True)}
        values["updated_at"] = now()
        connection.execute(
            """
            UPDATE projects
            SET name = :name, slug = :slug, summary = :summary, status = :status,
                stack = :stack, result = :result, link = :link, updated_at = :updated_at
            WHERE id = :id
            """,
            {**values, "stack": json.dumps(values["stack"], ensure_ascii=False), "id": project_id},
        )
        connection.commit()
        return fetch_project(project_id, connection=connection)
    except sqlite3.IntegrityError as error:
        connection.rollback()
        raise ValueError("Project slug already exists") from error
    finally:
        if owns_connection:
            connection.close()


def delete_project(project_id: int, *, connection: sqlite3.Connection | None = None) -> None:
    _delete_content("projects", "Project", project_id, connection=connection)


def fetch_note(note_id: int, *, connection: sqlite3.Connection | None = None) -> Note:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        row = connection.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
        if row is None:
            raise LookupError("Note not found")
        return row_to_note(row)
    finally:
        if owns_connection:
            connection.close()


def list_notes(*, note_type: str | None = None, connection: sqlite3.Connection | None = None) -> list[Note]:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        if note_type:
            rows = connection.execute("SELECT * FROM notes WHERE type = ? ORDER BY date DESC, id DESC", (note_type,)).fetchall()
        else:
            rows = connection.execute("SELECT * FROM notes ORDER BY date DESC, id DESC").fetchall()
        return [row_to_note(row) for row in rows]
    finally:
        if owns_connection:
            connection.close()


def create_note(payload: NoteCreate, *, connection: sqlite3.Connection | None = None) -> Note:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        values = payload.model_dump(mode="json")
        timestamp = now()
        cursor = connection.execute(
            """
            INSERT INTO notes (date, type, title, summary, tags, created_at, updated_at)
            VALUES (:date, :type, :title, :summary, :tags, :created_at, :updated_at)
            """,
            {**values, "tags": json.dumps(values.get("tags", []), ensure_ascii=False), "created_at": timestamp, "updated_at": timestamp},
        )
        connection.commit()
        return fetch_note(cursor.lastrowid, connection=connection)
    finally:
        if owns_connection:
            connection.close()


def update_note(note_id: int, payload: NoteUpdate, *, connection: sqlite3.Connection | None = None) -> Note:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        existing_row = connection.execute("SELECT * FROM notes WHERE id = ?", (note_id,)).fetchone()
        if existing_row is None:
            raise LookupError("Note not found")
        existing = dict(existing_row)
        existing["tags"] = _decode_list(existing.get("tags", "[]"))
        values = {**existing, **payload.model_dump(mode="json", exclude_unset=True)}
        values["updated_at"] = now()
        connection.execute(
            """
            UPDATE notes
            SET date = :date, type = :type, title = :title, summary = :summary,
                tags = :tags, updated_at = :updated_at
            WHERE id = :id
            """,
            {**values, "tags": json.dumps(values["tags"], ensure_ascii=False), "id": note_id},
        )
        connection.commit()
        return fetch_note(note_id, connection=connection)
    finally:
        if owns_connection:
            connection.close()


def delete_note(note_id: int, *, connection: sqlite3.Connection | None = None) -> None:
    _delete_content("notes", "Note", note_id, connection=connection)


def _delete_content(table: str, label: str, item_id: int, *, connection: sqlite3.Connection | None = None) -> None:
    owns_connection = connection is None
    connection = connection or connect()
    try:
        result = connection.execute(f"DELETE FROM {table} WHERE id = ?", (item_id,))
        if result.rowcount == 0:
            raise LookupError(f"{label} not found")
        connection.commit()
    finally:
        if owns_connection:
            connection.close()
