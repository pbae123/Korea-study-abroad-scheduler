import os

SECRET_KEY = os.environ.get("DJANGO_SECRET_KEY", "development-only-secret")
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
