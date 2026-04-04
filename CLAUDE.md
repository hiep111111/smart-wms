# Smart WMS — Claude Instructions

## Project Overview
Smart WMS (Quản lý kho thông minh) is a warehouse management system for 10 roles with dynamic RBAC, QR-based stock tracking, goods receipt/issue/transfer workflows, 3D map visualization, and reporting. Built on Next.js 15 App Router with Server Actions as the primary data layer and Prisma + SQLite as the database.

## Tech Stack
- **Framework:** Next.js 15, React 19, TypeScript 5
- **Styling:** Tailwind CSS v4 (utility-first, no component libraries)
- **ORM / DB:** Prisma 7, SQLite via libsql
- **Auth:** Jose (JWT HttpOnly cookies, 8h expiry), bcryptjs
- **QR:** html5-qrcode (scan), qrcode (generate)
- **3D Map:** Three.js, @react-three/fiber, @react-three/drei
- **Charts:** Recharts
- **Export:** xlsx, date-fns
- **Toasts:** sonner

## Dev Commands
- **Start dev server:** `npm run dev`
- **Build:** `npm run build`
- **Lint:** `npm run lint`
- **Database GUI:** `npx prisma studio`
- **Generate Prisma client:** `npx prisma generate`
- **Run migration:** `npx prisma migrate dev --name <name>`
- **Seed database:** `npx prisma db seed`

## Code Rules
- **TypeScript strict mode** — no `any`, no type suppression.
- **No unnecessary comments** — only comment non-obvious logic.
- **Functional Components only** — no class components.
- **No default exports for utilities/hooks** — use named exports.
- **Naming:** files → kebab-case; components → PascalCase; Server Actions / hooks → camelCase; DB models → PascalCase.

## Architecture Rules
- **Server Actions first** (`src/actions/`) — use for all CRUD, form submissions, and business logic.
- **Route Handlers** (`src/app/api/`) — only for streaming responses or external webhooks.
- **No direct Prisma calls from Client Components** — all DB access goes through Server Actions or RSC.
- **All Server Actions return `ActionResult<T>`** — never throw errors to the client.
- **Two-layer permission check:** middleware (route-level) + `getSession()` / `hasPermission()` (action-level).
- **Atomic inventory transactions** — use `prisma.$transaction()` for any IN/OUT/TRANSFER movement.

## Database Changes
Always use **Planning Mode** (`/plan`) before modifying `schema.prisma` or writing migrations. Do not apply schema changes without an approved plan.

## Warehouse Business Logic
If a request involves **Nhập kho (Goods Receipt)** or **Xuất kho (Goods Issue)** logic and the business rules are unclear, Claude **must ask clarifying questions** before writing any code. Confirm:
- Approval steps required?
- Stock validation on issue (block or warn)?
- Lot/batch/serial tracking needed?
- Who triggers the transaction (user role)?

## Documentation
All detailed specs live in `docs/`:
- `docs/REQUIREMENTS.md` — functional requirements and feature list
- `docs/SPECIFICATION.md` — 10-role authorization matrix
- `docs/TECHNICAL-DESIGN.md` — stack decisions, auth flow, error handling patterns
- `docs/MODULE-STRUCTURE.md` — 8 modules, their types, inputs/outputs, folder layout
- `docs/ARCHITECTURE.md` — layered architecture, request lifecycle, transaction patterns
- `docs/API-INTERFACE.md` — REST API contract (response envelope, error codes, all endpoints)

## Skills (Slash Commands)
- `/generate-api-route` — scaffold an API route handler following `docs/API-INTERFACE.md`
- `/generate-prisma-migration` — plan a safe schema change
- `/generate-component` — create a UI component following project patterns
- `/code-review` — review code against project rules and architecture
- `/run-tests` — run lint + build and fix failures
