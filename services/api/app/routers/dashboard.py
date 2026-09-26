from fastapi import APIRouter, Depends

from ..models import DashboardSummary
from ..store import dashboard_summary
from ..auth import require_auth

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"], dependencies=[Depends(require_auth)])


@router.get("/summary", response_model=DashboardSummary)
def get_dashboard_summary() -> DashboardSummary:
    return dashboard_summary()
