from __future__ import annotations

import json
import sqlite3
import sys
import tempfile
import unittest
from concurrent.futures import ThreadPoolExecutor
from contextlib import closing
from pathlib import Path
from unittest.mock import patch

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient

from app import publishing, store
from app.main import app
from app.models import ArticleCreate, ArticleUpdate


class PublishingTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        directory = Path(self.temporary.name)
        self.content = directory / "published"
        self.database_patch = patch.object(store, "DATABASE_PATH", directory / "content.db")
        self.content_patch = patch.object(publishing, "CONTENT_DIRECTORY", self.content)
        self.database_patch.start()
        self.content_patch.start()
        self.client_context = TestClient(app)
        self.client = self.client_context.__enter__()
        with closing(store.connect()) as connection:
            connection.execute("BEGIN IMMEDIATE")
            for table in ("articles", "collections", "projects", "notes"):
                connection.execute(f"DELETE FROM {table}")
            publishing.commit_content_change(connection)

    def tearDown(self):
        self.client_context.__exit__(None, None, None)
        self.content_patch.stop()
        self.database_patch.stop()
        self.temporary.cleanup()

    def snapshot(self):
        return json.loads((self.content / "snapshot.json").read_text(encoding="utf-8"))

    def create(self, **overrides):
        response = self.client.post("/api/articles", json={
            "title": "Markdown article", "slug": "markdown-article",
            "category": "Test", "content": "## Heading\n\n- First\n- Second",
            **overrides,
        })
        self.assertEqual(response.status_code, 201, response.text)
        return response.json()

    def markdown(self):
        reference = self.snapshot()["articles"][0]
        return (self.content / "articles" / f"{reference}.md").read_text(encoding="utf-8")

    def test_draft_excluded_and_publish_has_quoted_metadata(self):
        article = self.create(title='Title: "quoted"\nnext', excerpt="Summary: #tag")
        self.assertEqual(self.snapshot()["articles"], [])
        response = self.client.post(f"/api/articles/{article['id']}/publish")
        self.assertEqual(response.status_code, 200)
        markdown = self.markdown()
        metadata = json.loads(markdown.split("---\n")[1])
        self.assertEqual(metadata["title"], article["title"])
        self.assertEqual(metadata["description"], "Summary: #tag")
        self.assertFalse(metadata["draft"])
        self.assertIn("## Heading", markdown)
        self.assertNotIn("content", metadata)

    def test_published_edit_slug_withdraw_republish_delete(self):
        article = self.create(status="published")
        old_files = list((self.content / "articles").glob("*.md"))
        response = self.client.put(f"/api/articles/{article['id']}", json={
            "slug": "new-slug", "content": "# Changed", "status": "published",
        })
        self.assertEqual(response.status_code, 200)
        self.assertIn('"slug": "new-slug"', self.markdown())
        self.assertIn("# Changed", self.markdown())
        self.assertFalse(old_files[0].exists())
        date = response.json()["published_at"]
        response = self.client.post(f"/api/articles/{article['id']}/draft")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(self.snapshot()["articles"], [])
        self.assertEqual(list((self.content / "articles").glob("*.md")), [])
        self.assertEqual(self.client.post(f"/api/articles/{article['id']}/publish").json()["published_at"], date)
        self.assertEqual(self.client.delete(f"/api/articles/{article['id']}").status_code, 204)
        self.assertEqual(self.snapshot()["articles"], [])

    def test_empty_publish_rejected_without_changing_snapshot(self):
        article = self.create(content="")
        for route in (f"/api/articles/{article['id']}/publish",):
            self.assertEqual(self.client.post(route).status_code, 422)
        self.assertEqual(self.client.put(f"/api/articles/{article['id']}", json={"status": "published"}).status_code, 422)
        self.assertEqual(self.client.post("/api/articles", json={
            "title": "Empty", "slug": "empty", "category": "Test", "status": "published",
        }).status_code, 422)
        self.assertEqual(self.client.get(f"/api/articles/{article['id']}").json()["status"], "draft")
        self.assertEqual(self.snapshot()["articles"], [])

    def test_null_updates_rejected_for_all_content(self):
        article = self.create()
        for field in ("title", "slug", "status", "content", "excerpt"):
            self.assertEqual(self.client.put(f"/api/articles/{article['id']}", json={field: None}).status_code, 422)
        for route in ("collections", "projects", "notes"):
            self.assertEqual(self.client.put(f"/api/{route}/1", json={"title" if route != "projects" else "name": None}).status_code, 422)

    def test_slug_conflict_and_path_traversal(self):
        article = self.create(status="published")
        self.assertEqual(self.client.post("/api/articles", json={
            "title": "Duplicate", "slug": article["slug"], "category": "Test",
        }).status_code, 409)
        self.assertEqual(self.client.put(f"/api/articles/{article['id']}", json={"slug": "../private"}).status_code, 422)
        self.assertEqual(len(self.snapshot()["articles"]), 1)

    def test_content_tables_synchronized_and_deleted(self):
        payloads = {
            "collections": {"title": "Path", "slug": "path", "stages": ["One", "Two"], "done": 1},
            "projects": {"name": "Project", "slug": "project", "status": "online", "link": "https://example.com"},
            "notes": {"title": "Note", "type": "Progress", "date": "2026-09-26", "tags": ["Test"]},
        }
        for route, payload in payloads.items():
            response = self.client.post(f"/api/{route}", json=payload)
            self.assertEqual(response.status_code, 201, response.text)
            item_id = response.json()["id"]
            self.assertEqual(self.snapshot()[route][0]["id"], item_id)
            update = {"summary": "Updated"} if route != "collections" else {"description": "Updated"}
            self.assertEqual(self.client.put(f"/api/{route}/{item_id}", json=update).status_code, 200)
            self.assertEqual(self.snapshot()[route][0][next(iter(update))], "Updated")
            self.assertEqual(self.client.delete(f"/api/{route}/{item_id}").status_code, 204)
            self.assertEqual(self.snapshot()[route], [])

    def test_snapshot_write_failure_returns_503_and_rolls_back(self):
        article = self.create(status="published")
        before = self.snapshot()
        original_write = publishing.atomic_write
        def fail_snapshot(path, content):
            if path.name == "snapshot.json":
                raise OSError("Injected disk failure")
            original_write(path, content)
        with patch.object(publishing, "atomic_write", side_effect=fail_snapshot):
            response = self.client.put(f"/api/articles/{article['id']}", json={"content": "Changed"})
        self.assertEqual(response.status_code, 503)
        self.assertEqual(self.snapshot(), before)
        self.assertEqual(self.client.get(f"/api/articles/{article['id']}").json()["content"], article["content"])
        store.initialize_database()
        self.assertEqual(len(list((self.content / "articles").glob("*.md"))), 1)

    def test_database_commit_failure_restores_snapshot(self):
        article = self.create(status="published")
        before = self.snapshot()
        class FailingCommit:
            def __init__(self, connection):
                self.connection = connection
            def __getattr__(self, name):
                return getattr(self.connection, name)
            def commit(self):
                raise sqlite3.OperationalError("Injected commit failure")
        with closing(store.connect()) as connection:
            with self.assertRaises(publishing.ContentSyncError):
                store.update_article(article["id"], ArticleUpdate(content="Changed"), connection=FailingCommit(connection))
        self.assertEqual(self.snapshot(), before)
        self.assertEqual(store.fetch_article(article["id"]).content, article["content"])
        self.assertIn("## Heading", self.markdown())

    def test_all_published_exported_not_only_first_page(self):
        for index in range(55):
            store.create_article(ArticleCreate(title=f"Article {index}", slug=f"article-{index}", category="Test", content="Body", status="published"))
        self.assertEqual(len(self.snapshot()["articles"]), 55)
        self.assertEqual(len(list((self.content / "articles").glob("*.md"))), 55)

    def test_empty_tables_stay_empty_after_restart(self):
        store.initialize_database()
        self.assertEqual(self.snapshot(), {"version": 1, "articles": [], "collections": [], "projects": [], "notes": []})
        for route in ("articles", "collections", "projects", "notes"):
            self.assertEqual(self.client.get(f"/api/{route}").json(), [])

    def test_export_is_idempotent_and_preserves_unmanaged_files(self):
        self.create(status="published")
        unmanaged = self.content / "articles" / "manual.md"
        unmanaged.write_text("Not owned by exporter", encoding="utf-8")
        paths = [self.content / "snapshot.json", *self.content.glob("articles/article-*.md")]
        before = {path: (path.read_bytes(), path.stat().st_mtime_ns) for path in paths}
        store.initialize_database()
        self.assertEqual(before, {path: (path.read_bytes(), path.stat().st_mtime_ns) for path in paths})
        self.assertTrue(unmanaged.exists())

    def test_concurrent_writes_export_complete_snapshot(self):
        def create(index):
            return store.create_article(ArticleCreate(title=f"Concurrent {index}", slug=f"concurrent-{index}", category="Test", content="Body", status="published"))
        with ThreadPoolExecutor(max_workers=4) as pool:
            list(pool.map(create, range(12)))
        self.assertEqual(len(self.snapshot()["articles"]), 12)
        self.assertEqual(len(store.list_articles()), 12)


if __name__ == "__main__":
    unittest.main()
