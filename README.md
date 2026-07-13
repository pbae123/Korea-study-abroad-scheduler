# Korea-study-abroad-scheduler
Yonsei class scheduling system is terrible. Built this to make things easier 

## Tech Stack

- **React + Vite + TypeScript**
- **Tailwind CSS** for styling
- **React Context + useReducer** for app state (classes, schedules, active tab)
- **dnd-kit** for drag-and-drop placement of Classes onto the Schedule Grid
- **react-hook-form** for the Add Class form (multi-field validation, multi-add flow)
- **@headlessui/react** for accessible modal/dropdown primitives, styled with Tailwind
- **localStorage** (plain JSON, no persistence library) for all data — no backend
- **No automated test suite** — this is a personal single-user tool verified by manual use in-browser

See `CONTEXT.md` for the domain glossary (Class, Placement, Schedule, Conflict, etc.) and `docs/adr/` for architecture decision records.
