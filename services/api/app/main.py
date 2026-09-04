from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .core.settings import APP_TITLE, APP_VERSION, CORS_ORIGINS
from .routers.articles import router as articles_router
from .routers.dashboard import router as dashboard_router
from .routers.health import router as health_router
from .store import initialize_database

app = FastAPI(title=APP_TITLE, version=APP_VERSION)
app.add_middleware(
    CORSMiddleware,
    allow_origins=list(CORS_ORIGINS),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

initialize_database()
app.include_router(health_router)
app.include_router(dashboard_router)
app.include_router(articles_router)
