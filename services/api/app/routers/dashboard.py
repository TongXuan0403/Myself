from fastapi import APIRouter

from ..models import DashboardSummary
from ..store import dashboard_summary

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary() -> DashboardSummary:
    return dashboard_summary()
