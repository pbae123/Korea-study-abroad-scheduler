# Korea-study-abroad-scheduler
Yonsei class scheduling system is terrible. Built this to make things easier 

## Run locally

Prerequisites: Node.js, Python 3, and [Ollama](https://ollama.com/).

Install the local vision model once:

```bash
ollama pull qwen2.5vl:7b
```

Start the course-import API in one terminal:

```bash
cd backend
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp .env.example .env
# Edit .env and replace DJANGO_SECRET_KEY with a long random value.
.venv/bin/python manage.py runserver
```

Start the frontend in a second terminal from the repository root:

```bash
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`). The frontend proxies course-image imports to Django at `http://127.0.0.1:8000`, and Django sends them to the local Ollama model. Keep all three running while using image import.

`backend/.env` is intentionally ignored by Git. Keep keys and passwords there or in a deployment platform's secret store; never place secrets in `VITE_*` variables.

## Tech Stack

- **React + Vite + TypeScript**
- **Tailwind CSS** for styling
- **React Context + useReducer** for app state (classes, schedules, active tab)
- **dnd-kit** for drag-and-drop placement of Classes onto the Schedule Grid
- **react-hook-form** for the Add Class form (multi-field validation, multi-add flow)
- **@headlessui/react** for accessible modal/dropdown primitives, styled with Tailwind
- **localStorage** (plain JSON, no persistence library) for course and schedule data
- **Django REST API + local Ollama** for transient screenshot parsing with Qwen2.5-VL

See `CONTEXT.md` for the domain glossary (Class, Placement, Schedule, Conflict, etc.), `backend/README.md` for API setup, and `docs/adr/` for architecture decision records.
