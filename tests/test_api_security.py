"""
Unit & Integration Tests for Production API Security & CORS Hardening
NTRO Cyber Defense Standard Rev 2.4 (Roadmap Section 3.5 Compliance)
"""

import pytest
from fastapi.testclient import TestClient
from api.main import app
from api.config import Settings


@pytest.fixture(scope="module")
def client():
    return TestClient(app)


def test_cors_preflight_authorized_origin(client):
    """
    Verify that whitelisted tactical console origins receive valid CORS preflight headers
    with credentials explicitly permitted.
    """
    response = client.options(
        "/api/v1/events",
        headers={
            "Origin": "http://localhost:3000",
            "Access-Control-Request-Method": "GET",
            "Access-Control-Request-Headers": "Authorization,Content-Type",
        },
    )
    assert response.status_code == 200
    assert response.headers.get("access-control-allow-origin") == "http://localhost:3000"
    assert response.headers.get("access-control-allow-credentials") == "true"
    assert "GET" in response.headers.get("access-control-allow-methods", "")


def test_cors_preflight_unauthorized_origin_rejected(client):
    """
    Verify that unauthorized external origins are denied CORS access
    and no Access-Control-Allow-Origin header is mirrored back.
    """
    response = client.options(
        "/api/v1/events",
        headers={
            "Origin": "https://malicious-adversary.com",
            "Access-Control-Request-Method": "GET",
        },
    )
    # Under Starlette CORSMiddleware, forbidden origins do NOT receive the allow-origin header
    assert response.headers.get("access-control-allow-origin") is None


def test_defense_security_headers_present(client):
    """
    Verify that all standard responses carry mandatory NTRO cyber defense HTTP headers
    preventing MIME sniffing, UI clickjacking, and XSS.
    """
    endpoints = ["/health", "/", "/api/v1/security/posture"]
    for endpoint in endpoints:
        response = client.get(endpoint)
        assert response.status_code == 200
        headers = response.headers
        assert headers.get("x-content-type-options") == "nosniff"
        assert headers.get("x-frame-options") == "DENY"
        assert headers.get("x-xss-protection") == "1; mode=block"
        assert headers.get("referrer-policy") == "strict-origin-when-cross-origin"
        assert "geolocation=()" in headers.get("permissions-policy", "")
        assert "default-src 'self'" in headers.get("content-security-policy", "")


def test_security_posture_endpoint(client):
    """
    Verify /api/v1/security/posture reports active defense posture and validated origin counts.
    """
    response = client.get("/api/v1/security/posture")
    assert response.status_code == 200
    data = response.json()
    assert data["security_standard"] == "NTRO Cyber Defense Guideline Rev 2.4"
    assert data["cors_policy"]["mode"] == "authenticated_whitelist_zero_trust"
    assert data["cors_policy"]["wildcard_rejected"] is True
    assert data["cors_policy"]["allow_credentials"] is True
    assert "http://localhost:3000" in data["cors_policy"]["allowed_origins"]
    assert data["security_headers"]["x_frame_options"] == "DENY"


def test_cors_origin_parser_sanitization():
    """
    Verify Settings parser normalizes inputs, trims whitespace, strips trailing slashes,
    and unconditionally removes wildcard '*' entries.
    """
    test_settings = Settings()

    # 1. Comma-separated with spaces and trailing slashes
    test_settings._raw_cors_origins = (
        "http://tactical-console.local/ , https://nic-datacenter.gov.in , http://localhost:3000/ "
    )
    origins = test_settings.get_cors_origins()
    assert origins == [
        "http://tactical-console.local",
        "https://nic-datacenter.gov.in",
        "http://localhost:3000",
    ]

    # 2. Strict rejection of wildcard '*'
    test_settings._raw_cors_origins = "http://localhost:3000, *, https://defense.ntro.gov.in"
    origins_without_wildcard = test_settings.get_cors_origins()
    assert "*" not in origins_without_wildcard
    assert len(origins_without_wildcard) == 2
    assert "https://defense.ntro.gov.in" in origins_without_wildcard

    # 3. Fallback when string is empty or only whitespace
    test_settings._raw_cors_origins = "   "
    fallback_origins = test_settings.get_cors_origins()
    assert len(fallback_origins) >= 2
    assert "http://localhost:3000" in fallback_origins
