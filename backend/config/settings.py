import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
# Local credentials live in backend/.env, which is deliberately ignored by Git.
# Real deployment environments provide the same values through their secret store.
load_dotenv(BASE_DIR / ".env")

# This fallback is for the stateless local development/test server only. Set a
# real value in backend/.env before deploying anywhere shared or public.
SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "unsafe-development-key-do-not-deploy")
DEBUG = os.environ.get("DJANGO_DEBUG", "false").lower() == "true"
ALLOWED_HOSTS = [host for host in os.environ.get("DJANGO_ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if host]
INSTALLED_APPS = ["corsheaders", "rest_framework", "imports"]
MIDDLEWARE = ["corsheaders.middleware.CorsMiddleware", "django.middleware.common.CommonMiddleware"]
ROOT_URLCONF = "config.urls"
TEMPLATES = []
WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"
# Django's framework and test runner require a configured database backend. This
# in-memory SQLite database is never used by the app and creates no data file;
# application data remains exclusively in browser localStorage.
DATABASES = {"default": {"ENGINE": "django.db.backends.sqlite3", "NAME": ":memory:"}}
REST_FRAMEWORK = {"DEFAULT_RENDERER_CLASSES": ["rest_framework.renderers.JSONRenderer"], "UNAUTHENTICATED_USER": None}
CORS_ALLOWED_ORIGINS = [origin.strip() for origin in os.environ.get("FRONTEND_ORIGIN", "http://localhost:5173").split(",") if origin.strip()]
DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
