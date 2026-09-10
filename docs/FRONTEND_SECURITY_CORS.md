# NTRO Defense-Hardened CORS & API Security Integration Guide

## 1. Executive Summary & Security Compliance
Under **NTRO Cyber Defense Standard Rev 2.4** and Zero-Trust network architecture guidelines, the FastAPI backend rejects all wildcard origins (`allow_origins=["*"]`) when processing geospatial fire telemetry, incident replays, and operator audit trails. 

This document provides exact deployment configurations for tactical dashboard frontend instances, reverse proxies, and air-gapped intranet servers.

---

## 2. Hardened Architecture & Protections

### 2.1 Enforced Security Headers
Every HTTP response from the backend automatically injects the following defense headers:
- `X-Content-Type-Options: nosniff` — Prevents MIME-confusion attacks and malicious payload execution.
- `X-Frame-Options: DENY` — Strictly blocks iframe embedding to eliminate UI clickjacking risks on tactical consoles.
- `X-XSS-Protection: 1; mode=block` — Enforces immediate browser page termination if reflected XSS is detected.
- `Referrer-Policy: strict-origin-when-cross-origin` — Restricts cross-origin referrer leakage of internal coordinates or API tokens.
- `Permissions-Policy: geolocation=(), camera=(), microphone=()` — Completely restricts access to hardware sensors.
- `Content-Security-Policy: default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data: blob:;` — Sanitizes script and asset loading.
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` — Automatically activated when running in production environments under HTTPS.

### 2.2 Zero-Wildcard CORS Policy
1. **Explicit Whitelisting**: Only designated origins defined in the backend environment (`CORS_ORIGINS`) receive valid `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials: true` headers.
2. **Wildcard Rejection**: Any attempt to supply `*` in `CORS_ORIGINS` is automatically stripped by the runtime validator with an operational security alert logged to Sentry.
3. **Restricted HTTP Verbs**: Only `GET`, `POST`, `PUT`, `DELETE`, and `OPTIONS` are allowed. Arbitrary HTTP verbs are rejected at the gateway.
4. **Preflight Cache**: `max_age=600` (10 minutes) eliminates redundant preflight roundtrips for low-bandwidth satellite links.

---

## 3. Environment Variable Configuration

### 3.1 Local Tactical Console Development (`.env` or `.env.local`)
```bash
# FastAPI Backend (.env)
CORS_ORIGINS="http://localhost:3000,http://127.0.0.1:3000,http://localhost:8000,http://127.0.0.1:8000"
ALLOWED_HOSTS="localhost,127.0.0.1,testserver"

# Next.js Tactical Frontend (.env.local)
NEXT_PUBLIC_API_URL="http://localhost:8000"
```

### 3.2 Production / Cloud Deployment (Vercel + Render)
When deploying the frontend to Vercel and the backend to Render:
```bash
# FastAPI Backend (Render Environment Settings)
ENVIRONMENT="production"
CORS_ORIGINS="https://ntro-fire-dashboard.vercel.app,https://tactical-console.ntro.gov.in"
ALLOWED_HOSTS="ntro-fire-api.onrender.com,api.ntro.gov.in"
```

### 3.3 Defense Intranet / Air-Gapped Setup
For classified networks utilizing `.gov.in` or `.nic.in` subdomains:
```bash
# FastAPI Backend (.env)
ENVIRONMENT="production"
CORS_ORIGINS="https://console.fire.ntro.gov.in,https://hq-display.nic.in"
CORS_ORIGIN_REGEX="^https://.*\.gov\.in(:[0-9]+)?$"
ALLOWED_HOSTS="*.ntro.gov.in,*.nic.in,localhost"
```

---

## 4. Reverse-Proxy Configuration (NGINX / Air-Gapped Edge)

For air-gapped field servers running NGINX in front of Uvicorn:

```nginx
server {
    listen 443 ssl http2;
    server_name console.fire.ntro.gov.in;

    ssl_certificate /etc/ssl/certs/ntro_tactical.crt;
    ssl_certificate_key /etc/ssl/private/ntro_tactical.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location /api/ {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Defense Proxy Headers
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 5. Security Posture Verification Endpoint

Analysts and network supervisors can verify active defense posture at any time:

```bash
curl -X GET "http://localhost:8000/api/v1/security/posture"
```

### Response Schema:
```json
{
  "security_standard": "NTRO Cyber Defense Guideline Rev 2.4",
  "cors_policy": {
    "mode": "authenticated_whitelist_zero_trust",
    "allowed_origins_count": 4,
    "allowed_origins": [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      "http://localhost:8000",
      "http://127.0.0.1:8000"
    ],
    "allow_credentials": true,
    "regex_pattern": null,
    "max_age_seconds": 600,
    "wildcard_rejected": true
  },
  "security_headers": {
    "x_content_type_options": "nosniff",
    "x_frame_options": "DENY",
    "x_xss_protection": "1; mode=block",
    "referrer_policy": "strict-origin-when-cross-origin",
    "permissions_policy": "geolocation=(), camera=(), microphone=()",
    "content_security_policy": "enforced",
    "hsts_active": false
  },
  "allowed_hosts": [
    "localhost",
    "127.0.0.1",
    "testserver"
  ],
  "environment": "development"
}
```
