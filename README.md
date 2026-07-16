# Korea-study-abroad-scheduler
Yonsei class scheduling system is terrible. Built this to make things easier 

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
