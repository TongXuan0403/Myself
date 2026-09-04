from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware

from .models import Article, ArticleCreate, ArticleStatusUpdate, ArticleUpdate, DashboardSummary, Status
from .store import (
    create_article,
    dashboard_summary,
    delete_article,
    fetch_article,
    fetch_article_by_slug,
    initialize_database,
    list_articles,
    set_article_status,
    update_article,
)

app = FastAPI(title="Myself Blog Publishing API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:4321"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

initialize_database()


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok", "service": "publishing-api"}


@app.get("/api/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary() -> DashboardSummary:
    return dashboard_summary()


@app.get("/api/articles", response_model=list[Article])
def get_articles(
    status: Status | None = Query(default=None),
    q: str | None = Query(default=None, description="Search by title, slug, category, excerpt, or content"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[Article]:
    return list_articles(status=status, query=q, limit=limit, offset=offset)


@app.get("/api/articles/{article_id}", response_model=Article)
def get_article(article_id: int) -> Article:
    try:
        return fetch_article(article_id)
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Article not found") from error


@app.get("/api/articles/slug/{slug}", response_model=Article)
def get_article_by_slug(slug: str) -> Article:
    try:
        return fetch_article_by_slug(slug.strip().lower())
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Article not found") from error


@app.post("/api/articles", response_model=Article, status_code=201)
def post_article(payload: ArticleCreate) -> Article:
    try:
        return create_article(payload)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@app.put("/api/articles/{article_id}", response_model=Article)
def put_article(article_id: int, payload: ArticleUpdate) -> Article:
    try:
        return update_article(article_id, payload)
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Article not found") from error
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@app.patch("/api/articles/{article_id}/status", response_model=Article)
def patch_article_status(article_id: int, payload: ArticleStatusUpdate) -> Article:
    try:
        return set_article_status(article_id, payload.status)
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Article not found") from error


@app.post("/api/articles/{article_id}/publish", response_model=Article)
def publish_article(article_id: int) -> Article:
    try:
        return set_article_status(article_id, "published")
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Article not found") from error


@app.post("/api/articles/{article_id}/draft", response_model=Article)
def draft_article(article_id: int) -> Article:
    try:
        return set_article_status(article_id, "draft")
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Article not found") from error


@app.delete("/api/articles/{article_id}", status_code=204)
def remove_article(article_id: int) -> None:
    try:
        delete_article(article_id)
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Article not found") from error
