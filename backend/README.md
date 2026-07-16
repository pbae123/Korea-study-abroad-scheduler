# Course import API

Stateless Django API for screenshot parsing with local Ollama `qwen2.5vl:7b` (Qwen2.5-VL 7B).
It has no database and does not persist uploaded images, parsed results, courses, or schedules.

First install the model once with `ollama pull qwen2.5vl:7b`. Then run from this directory: create a virtual environment, install `pip install -r requirements.txt`, copy `.env.example` to `.env`, set a long random `DJANGO_SECRET_KEY`, then run `python manage.py runserver`.

`backend/.env` is ignored by Git. Store server-side secrets there for local development (or in the deployment platform's secret store); do not put secrets in frontend `VITE_*` variables.

Verify the endpoint layer with `python manage.py test imports`.

The API and Ollama must run on the same computer. In development, Vite proxies `/api` to Django automatically.
