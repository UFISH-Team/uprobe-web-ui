# U-Probe Web UI

Web frontend for the U-Probe universal probe design platform. Covers probe design
(design workflow and custom DAG-based probes), genome management, task and result
tracking, an AI agent chat surface, and tutorials.

React 18 + TypeScript + Vite, with MUI v6 for the component layer.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | React 18, TypeScript 5 |
| Build | Vite 5 |
| UI | MUI v6, Emotion |
| Routing | React Router v6 |
| Server state / HTTP | Axios (`src/api.ts`) |
| Client state | Zustand (`src/store/`) |
| Charts | Plotly (`react-plotly.js`) |
| Canvas | Konva / react-konva (custom probe DAG) |
| File parsing | PapaParse, JSZip, js-yaml |
| Misc | react-markdown + remark-gfm, antd icons, dagre, notistack |

## Requirements

- Node.js 18+
- pnpm
- The U-Probe FastAPI backend running locally

## Local development

The backend serves the API on port `8005` and the frontend dev server proxies
`/api` to it, so start the backend first.

### 1. Backend (WSL / Linux)

```bash
cd /path/to/U-Probe
conda activate uprobe  # or any Python 3.10+ environment
uprobe server --env development --host 127.0.0.1 --port 8005 --workers 1
```

Ensure the backend `config.ini` uses local Linux data paths and
`frontend_url = http://localhost:5173`.

### 2. Frontend (separate terminal)

```powershell
cd /path/to/uprobe-web-ui
pnpm install
pnpm dev --host 127.0.0.1 --port 5173
```

Open http://localhost:5173. Frontend changes update automatically; backend development mode reloads Python changes.

## API connection

`.env` ships with a single variable:

```dotenv
VITE_API_BASE_URL=/api
```

Vite proxies `/api` to `http://127.0.0.1:8005` and strips the `/api` prefix
(see `server.proxy` in `vite.config.ts`), so no further configuration is needed
for the setup above.

- Connection check: http://localhost:5173/api/ should return `{"message":"Hello, World!"}`
- API docs: http://localhost:8005/docs
- To create a local test account without email verification, use `POST /auth/register`

If the backend port changes, update `server.proxy` in `vite.config.ts` and
restart Vite.

When the proxy fails, check http://127.0.0.1:8005/ from Windows first to
confirm the backend itself is reachable.

## Commands

```bash
pnpm dev      # development server
pnpm build    # TypeScript check + production build
pnpm lint     # ESLint
pnpm preview  # preview the built frontend (needs its own API routing)
```

The `/api` proxy only applies to the dev server. Production hosting needs either
its own reverse proxy or `VITE_API_BASE_URL` set at build time.

## Routes

All routes except `/auth` sit behind `ProtectedRoute` and redirect to `/auth`
when unauthenticated.

| Route | Page |
| --- | --- |
| `/auth` | Sign in / registration |
| `/home` | Dashboard |
| `/design` | Design method picker |
| `/design/designworkflow` | Guided design workflow |
| `/design/customprobe` | Custom DAG-based probe design |
| `/genome` | Genome and folder management |
| `/task` | Task results and reports |
| `/agent` | AI agent chat (full-screen, no drawer) |
| `/tutorial` | Tutorials |
| `/account/profile` | Profile and avatar |
| `/account/settings` | Account settings |
| `/account/logout` | Sign out |

## Source layout

```
src/
  api.ts               Axios client, auth interceptor, API surface
  App.tsx              Shell, drawer navigation, routes
  theme.ts             Light/dark theme options
  style.ts             Shared style helpers
  constants.ts         Shared constants
  types.ts             Shared TypeScript types
  utils.ts             Token storage and misc helpers
  contexts/            AuthContext, ThemeContext (light/dark toggle)
  hooks/               useFileOperations, useGenomeData, useNotification
  store/               Zustand: designStore, taskStore
  utils/               apiErrorMessage
  pages/               One file per route
  components/
    common/            Layout, Accordion, Alert, NotFound
    task/              TaskTable, TaskStatistics
    users/             AccountMenu, Profile, Settings, Logout
```

## Theming

`src/theme.ts` defines `lightThemeOptions` and `darkThemeOptions`; the active
mode is persisted to `localStorage` under `themeMode` and defaults to dark.
`ThemeContext` also mirrors the mode onto `<html>` as `data-theme-mode` so plain
CSS in `src/index.css` can react via `color-scheme` and CSS variables.

Prefer theme tokens (`primary.main`, `text.secondary`, `divider`,
`background.paper`, `alpha()`) over literal color values in `sx`. For text on a
computed background, use `theme.palette.getContrastText(bg)` rather than
hardcoding white, so contrast holds in both modes.
