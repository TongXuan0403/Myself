from __future__ import annotations

import hashlib
import json
import logging
import os
import re
import sqlite3
import tempfile
from datetime import datetime
from pathlib import Path

CONTENT_DIRECTORY = Path(
    os.environ.get(
        "MYSELF_CONTENT_DIR",
        str(Path(__file__).resolve().parents[3] / "apps/site/src/content/published"),
    )
).resolve()
MANAGED_ARTICLE = re.compile(r"article-\d+-[0-9a-f]{16}\.md")
logger = logging.getLogger(__name__)


class ContentSyncError(RuntimeError):
    pass


class PublicationValidationError(RuntimeError):
    pass


def atomic_write(path: Path, content: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=path.parent, suffix=".tmp", delete=False) as temporary:
        temporary_path = Path(temporary.name)
        try:
            temporary.write(content)
            temporary.flush()
            os.fsync(temporary.fileno())
        except BaseException:
            temporary.close()
            temporary_path.unlink(missing_ok=True)
            raise
    try:
        temporary_path.replace(path)
    finally:
        temporary_path.unlink(missing_ok=True)


def export_content(connection: sqlite3.Connection) -> set[str]:
    # Import locally to keep the exporter and SQLite repository independently usable.
    from .store import list_collections, list_notes, list_projects, row_to_article

    references: list[str] = []
    rows = connection.execute(
        "SELECT * FROM articles WHERE status = 'published' ORDER BY published_at DESC, id DESC"
    ).fetchall()
    for row in rows:
        article = row_to_article(row)
        if not article.content.strip():
            raise PublicationValidationError("Published article content cannot be empty")
        metadata = {
            "title": article.title,
            "slug": article.slug,
            "description": article.excerpt,
            "date": datetime.fromisoformat(article.published_at or article.updated_at).date().isoformat(),
            "category": article.category,
            "tags": [],
            "readingTime": article.reading_time_minutes,
            "featured": False,
            "draft": False,
        }
        # JSON is a YAML subset; quoting preserves multiline strings and special characters.
        markdown = (
            f"---\n{json.dumps(metadata, ensure_ascii=False, indent=2)}\n---\n\n"
            f"{article.content.rstrip()}\n"
        ).encode("utf-8")
        digest = hashlib.sha256(markdown).hexdigest()[:16]
        reference = f"article-{article.id}-{digest}"
        metadata["id"] = reference
        markdown = (
            f"---\n{json.dumps(metadata, ensure_ascii=False, indent=2)}\n---\n\n"
            f"{article.content.rstrip()}\n"
        ).encode("utf-8")
        path = CONTENT_DIRECTORY / "articles" / f"{reference}.md"
        if not path.exists() or path.read_bytes() != markdown:
            atomic_write(path, markdown)
        references.append(reference)

    snapshot = {
        "version": 1,
        "articles": references,
        "collections": [item.model_dump(mode="json") for item in list_collections(connection=connection)],
        "projects": [item.model_dump(mode="json") for item in list_projects(connection=connection)],
        "notes": [item.model_dump(mode="json") for item in list_notes(connection=connection)],
    }
    encoded = (json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n").encode("utf-8")
    snapshot_path = CONTENT_DIRECTORY / "snapshot.json"
    if not snapshot_path.exists() or snapshot_path.read_bytes() != encoded:
        atomic_write(snapshot_path, encoded)
    return {f"{reference}.md" for reference in references}


def commit_content_change(connection: sqlite3.Connection) -> None:
    snapshot_path = CONTENT_DIRECTORY / "snapshot.json"
    previous = None
    replaced = False
    try:
        previous = snapshot_path.read_bytes() if snapshot_path.exists() else None
        active_files = export_content(connection)
        replaced = True
        connection.commit()
    except BaseException as error:
        connection.rollback()
        if replaced:
            if previous is None:
                snapshot_path.unlink(missing_ok=True)
            else:
                atomic_write(snapshot_path, previous)
        if isinstance(error, PublicationValidationError):
            raise
        if isinstance(error, (OSError, sqlite3.Error, ValueError)):
            logger.exception("Public content synchronization failed")
            raise ContentSyncError("Content synchronization failed; database changes were rolled back") from error
        raise

    # Reacquire the write lock: a newer writer may already have replaced the snapshot.
    try:
        connection.execute("BEGIN IMMEDIATE")
        current = json.loads(snapshot_path.read_text(encoding="utf-8"))
        active_files = {f"{reference}.md" for reference in current["articles"]}
        for path in (CONTENT_DIRECTORY / "articles").glob("*.md"):
            if MANAGED_ARTICLE.fullmatch(path.name) and path.name not in active_files:
                try:
                    path.unlink()
                except OSError:
                    logger.warning("Could not remove obsolete article file: %s", path.name)
        connection.commit()
    except (OSError, sqlite3.Error, ValueError, KeyError):
        connection.rollback()
        logger.warning("Obsolete content cleanup deferred until next synchronization", exc_info=True)
