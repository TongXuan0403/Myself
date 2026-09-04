from fastapi import APIRouter, HTTPException, Query

from ..models import Article, ArticleCreate, ArticleStatusUpdate, ArticleUpdate, Status
from ..store import (
    create_article,
    delete_article,
    fetch_article,
    fetch_article_by_slug,
    list_articles,
    set_article_status,
    update_article,
)

router = APIRouter(prefix="/api/articles", tags=["articles"])


@router.get("", response_model=list[Article])
def get_articles(
    status: Status | None = Query(default=None),
    q: str | None = Query(default=None, description="Search by title, slug, category, excerpt, or content"),
    limit: int = Query(default=50, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
) -> list[Article]:
    return list_articles(status=status, query=q, limit=limit, offset=offset)


@router.get("/{article_id}", response_model=Article)
def get_article(article_id: int) -> Article:
    try:
        return fetch_article(article_id)
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Article not found") from error


@router.get("/slug/{slug}", response_model=Article)
def get_article_by_slug(slug: str) -> Article:
    try:
        return fetch_article_by_slug(slug.strip().lower())
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Article not found") from error


@router.post("", response_model=Article, status_code=201)
def post_article(payload: ArticleCreate) -> Article:
    try:
        return create_article(payload)
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.put("/{article_id}", response_model=Article)
def put_article(article_id: int, payload: ArticleUpdate) -> Article:
    try:
        return update_article(article_id, payload)
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Article not found") from error
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@router.patch("/{article_id}/status", response_model=Article)
def patch_article_status(article_id: int, payload: ArticleStatusUpdate) -> Article:
    try:
        return set_article_status(article_id, payload.status)
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Article not found") from error


@router.post("/{article_id}/publish", response_model=Article)
def publish_article(article_id: int) -> Article:
    try:
        return set_article_status(article_id, "published")
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Article not found") from error


@router.post("/{article_id}/draft", response_model=Article)
def draft_article(article_id: int) -> Article:
    try:
        return set_article_status(article_id, "draft")
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Article not found") from error


@router.delete("/{article_id}", status_code=204)
def remove_article(article_id: int) -> None:
    try:
        delete_article(article_id)
    except LookupError as error:
        raise HTTPException(status_code=404, detail="Article not found") from error
