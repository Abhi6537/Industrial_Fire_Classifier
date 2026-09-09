"""
FastAPI Application Entry Point
NTRO Industrial Fire Detection & Classification System
Production-grade RESTful API for geospatial fire detection and classification.
"""

import logging
from fastapi import FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from api.config import settings
from api.routers import events, sites, alerts, audit, classify, detections

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("main_api")

# Initialize Sentry Error Tracking if DSN is configured
if settings.SENTRY_DSN:
    try:
        import sentry_sdk
        from sentry_sdk.integrations.fastapi import FastApiIntegration
        sentry_sdk.init(
            dsn=settings.SENTRY_DSN,
            integrations=[FastApiIntegration()],
            traces_sample_rate=0.2,
            environment=settings.ENVIRONMENT,
        )
        logger.info("Sentry error tracking initialized successfully.")
    except Exception as e:
        logger.warning(f"Could not initialize Sentry: {e}")

# Create FastAPI application
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Geospatial AI platform distinguishing industrial fires from normal operational flaring using satellite anomaly baseline modeling.",
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware (configured for local tactical console and authenticated domains)
cors_origins = settings.CORS_ORIGINS if settings.ENVIRONMENT == "production" else ["http://localhost:3000", "http://127.0.0.1:3000", "*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Sanitized Error Handler (Security Rule: Never expose internal stack traces)
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled server exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "Internal Server Error",
            "message": "An unexpected error occurred. The incident has been logged for security review.",
            "path": request.url.path,
        },
    )

# Include API Routers under /api/v1 prefix
app.include_router(events.router, prefix=settings.API_V1_STR)
app.include_router(sites.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(audit.router, prefix=settings.API_V1_STR)
app.include_router(classify.router, prefix=settings.API_V1_STR)
app.include_router(detections.router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["System Health"])
def health_check():
    """System health and readiness probe."""
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "environment": settings.ENVIRONMENT,
        "target_region": settings.TARGET_REGION,
    }


@app.get("/", tags=["Root"])
def root():
    """Root metadata redirect."""
    return {
        "name": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "documentation": "/docs",
        "health": "/health",
        "endpoints": {
            "events": f"{settings.API_V1_STR}/events",
            "sites": f"{settings.API_V1_STR}/sites",
            "alerts": f"{settings.API_V1_STR}/alerts",
            "audit": f"{settings.API_V1_STR}/audit",
            "classify": f"{settings.API_V1_STR}/classify",
        }
    }
