from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from .core.settings import APP_TITLE, APP_VERSION, CORS_ORIGINS
from .routers.articles import router as articles_router
from .routers.auth import router as auth_router
from .routers.content import collections_router, notes_router, projects_router
from .routers.dashboard import router as dashboard_router
from .routers.health import router as health_router
from .store import initialize_database
from .publishing import ContentSyncError, PublicationValidationError


@asynccontextmanager
async def lifespan(app: FastAPI):
    initialize_database()
    yield


app = FastAPI(title=APP_TITLE, version=APP_VERSION, lifespan=lifespan)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(CORS_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.exception_handler(ContentSyncError)
async def content_sync_error(request: Request, error: ContentSyncError) -> JSONResponse:
    return JSONResponse(status_code=503, content={"detail": str(error)})


@app.exception_handler(PublicationValidationError)
async def publication_validation_error(request: Request, error: PublicationValidationError) -> JSONResponse:
    return JSONResponse(status_code=422, content={"detail": str(error)})


app.include_router(health_router)
app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(articles_router)
app.include_router(collections_router)
app.include_router(projects_router)
app.include_router(notes_router)
