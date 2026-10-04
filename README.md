# U-Probe Web UI

React 18 + TypeScript + Vite frontend for probe design, genome management, tasks, and reports.

## Local development

Requires Node.js 18+, pnpm, and the U-Probe FastAPI backend.

Start the backend in WSL/Linux:

```bash
cd /path/to/U-Probe
conda activate uprobe  # or your existing Python 3.10+ environment
uprobe server --env development --host 127.0.0.1 --port 8005 --workers 1
```

Ensure the backend `config.ini` uses local Linux data paths and `frontend_url = http://localhost:5173`.

Start the frontend in a separate Windows PowerShell terminal:

```powershell
cd /path/to/uprobe-web-ui
pnpm install  # first run or after dependency changes
pnpm dev --host 127.0.0.1 --port 5173
```

Open http://localhost:5173. Frontend changes update automatically; backend development mode reloads Python changes.

## API connection

The current `.env` uses:

```dotenv
VITE_API_BASE_URL=/api
```

Vite proxies `/api` to `http://127.0.0.1:8005` and removes the `/api` prefix. No configuration change is needed for the setup above. If the backend port changes, update `server.proxy` in `vite.config.ts` and restart Vite.

- Connection check: http://localhost:5173/api/ should return `{"message":"Hello, World!"}`.
- API docs: http://localhost:8005/docs. Use `POST /auth/register` to create a local test account without email verification.
- If the proxy fails, first check http://localhost:8005/ from Windows.

## Commands

```bash
pnpm dev      # development server
pnpm build    # TypeScript check + production build
pnpm lint     # ESLint
pnpm preview  # preview built frontend; requires separate API routing
```

The `/api` proxy applies to the development server. Production hosting needs its own API proxy or `VITE_API_BASE_URL` set at build time.

## Source layout

- `src/api.ts`: API client
- `src/pages/`: pages
- `src/components/`: shared components
- `src/store/`: Zustand state
