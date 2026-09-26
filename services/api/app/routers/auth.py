from fastapi import APIRouter

from ..auth import LoginRequest, LoginResponse, authenticate

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest) -> LoginResponse:
    return LoginResponse(access_token=authenticate(payload.email, payload.password), expires_in=43200)
