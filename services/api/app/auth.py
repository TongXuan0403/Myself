from __future__ import annotations

import base64
import hashlib
import hmac
import json
import os
import time

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel


ADMIN_EMAIL = os.environ.get("MYSELF_ADMIN_EMAIL", "admin@example.com").strip().lower()
ADMIN_PASSWORD = os.environ.get("MYSELF_ADMIN_PASSWORD", "change-me-before-production")
AUTH_SECRET = os.environ.get("MYSELF_AUTH_SECRET", "local-development-secret")
TOKEN_TTL_SECONDS = int(os.environ.get("MYSELF_AUTH_TTL", "43200"))
bearer = HTTPBearer(auto_error=False)


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


def _encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).decode().rstrip("=")


def _decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def issue_token(email: str) -> str:
    payload = {"sub": email, "exp": int(time.time()) + TOKEN_TTL_SECONDS}
    encoded = _encode(json.dumps(payload, separators=(",", ":")).encode())
    signature = hmac.new(AUTH_SECRET.encode(), encoded.encode(), hashlib.sha256).digest()
    return f"{encoded}.{_encode(signature)}"


def verify_token(token: str) -> str:
    try:
        encoded, supplied_signature = token.split(".", 1)
        expected = hmac.new(AUTH_SECRET.encode(), encoded.encode(), hashlib.sha256).digest()
        if not hmac.compare_digest(_decode(supplied_signature), expected):
            raise ValueError
        payload = json.loads(_decode(encoded))
        if payload.get("sub") != ADMIN_EMAIL or int(payload.get("exp", 0)) < int(time.time()):
            raise ValueError
        return ADMIN_EMAIL
    except (ValueError, KeyError, TypeError, json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")


def authenticate(email: str, password: str) -> str:
    if not hmac.compare_digest(email.strip().lower(), ADMIN_EMAIL) or not hmac.compare_digest(password, ADMIN_PASSWORD):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password")
    return issue_token(ADMIN_EMAIL)


def require_auth(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> str:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Authentication required")
    return verify_token(credentials.credentials)
