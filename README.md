# U-Probe Web (UI)

Web interface for the U-Probe platform: interactive protocol design, genome management, and queued workflow execution with traceable outputs.

## Stack

- React 18 + TypeScript
- Vite 5
- MUI (Material UI) + Ant Design (selected components)
- Zustand for client-side state
- Axios for HTTP, JSZip for report handling

## Prerequisites

- Node.js >= 18
- pnpm (recommended) or npm
- A running U-Probe HTTP backend (FastAPI)

## Quick start

```bash
cd uprobe-web-ui
pnpm install
pnpm dev
```

The dev server runs on `http://localhost:5173` by default.

## Configuration

Set the backend base URL via Vite env:

- `VITE_API_BASE_URL`: backend URL (default: `http://127.0.0.1:8000`)

Example:

```bash
export VITE_API_BASE_URL="http://127.0.0.1:8000"
pnpm dev
```

## Scripts

```bash
pnpm dev      # start dev server
pnpm build    # typecheck + production build
pnpm preview  # preview production build
pnpm lint     # eslint
```

## What the UI provides

- Authentication and session management
- Task lifecycle management (queued/running/completed/failed) with error details
- Result download and self-contained HTML report viewer
- Genome browser and file operations (upload/list/metadata)
- Custom probe type management

## Project layout (high level)

- `src/api.ts`: API client and interceptors
- `src/store/`: Zustand stores (tasks, auth, etc.)
- `src/pages/`: top-level routes
- `src/components/`: reusable UI components

## Notes for contributors

- Prefer small, composable components and deterministic state updates.
- Keep API contracts explicit (types in `src/types.ts`), and propagate backend error details to the UI.
