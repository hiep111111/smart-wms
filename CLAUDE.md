# Smart WMS — Claude Instructions

## Project Overview
Smart WMS (Quản lý kho thông minh) — Next.js 15, Tailwind CSS v4, Prisma (SQLite).

## Dev Commands
- **Start dev server:** `npm run dev`
- **Database GUI:** `npx prisma studio`
- **Generate Prisma client:** `npx prisma generate`
- **Run migrations:** `npx prisma migrate dev`

## Code Rules
- **TypeScript strict mode** — no `any`, no type suppression.
- **No unnecessary comments** — only comment non-obvious logic.
- **Functional Components only** — no class components.
- **No default exports for utilities/hooks** — use named exports.

## Database Changes
Always use **Planning Mode** (`/plan`) before modifying the database schema (`schema.prisma`) or writing migrations. Do not apply schema changes without an approved plan.

## Warehouse Business Logic
If a request involves **Nhập kho (Goods Receipt)** or **Xuất kho (Goods Issue)** logic and the business rules are unclear or ambiguous, Claude **must ask clarifying questions** before writing any code. Do not assume workflow — confirm:
- Approval steps required?
- Stock validation on issue (block or warn)?
- Lot/batch/serial tracking needed?
- Who triggers the transaction (user role)?
