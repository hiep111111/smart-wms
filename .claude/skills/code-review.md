---
name: code-review
description: Review code against Smart WMS project rules, architecture constraints, and API contract
allowed-tools: Read, Grep, Glob
---

You are reviewing code in the Smart WMS project. Read the file(s) the user specifies, then check each category below.

## Category 1 — Code Rules (CLAUDE.md)
- [ ] No `any` types or type suppressions (`@ts-ignore`, `as any`)
- [ ] Only functional components — no class components
- [ ] Named exports for utilities and hooks (no default export)
- [ ] No unnecessary comments (only non-obvious logic should be commented)
- [ ] Naming: files kebab-case, components PascalCase, actions/hooks camelCase

## Category 2 — Architecture Rules
- [ ] No direct Prisma calls from Client Components (`"use client"` files)
- [ ] Server Actions return `ActionResult<T>` — not throwing errors to client
- [ ] Two-layer permission check: middleware route-level + `getSession()` / `hasPermission()` at action level
- [ ] Inventory IN/OUT/TRANSFER uses `prisma.$transaction()` — never bare sequential writes
- [ ] Client Components use `"use client"` directive only when needed (hooks, events, browser APIs)

## Category 3 — API Route Handlers (if applicable)
Read `docs/API-INTERFACE.md` and check:
- [ ] Response uses `{ success: true, data }` / `{ success: false, error: { code, message } }` envelope
- [ ] Correct HTTP status codes per error type (401, 403, 404, 409, 422, 500)
- [ ] Auth guard present (`getSession()` + `hasPermission()`)
- [ ] No business logic in the route — delegates to Server Action

## Category 4 — Inventory / Business Logic (if applicable)
Read `docs/ARCHITECTURE.md` and check:
- [ ] Enum values used (not magic strings like `"IN"`, `"OUT"` — use `MovementType.IN`)
- [ ] Vietnamese UI labels consistent with rest of codebase
- [ ] Approval workflow respected for Nhập kho / Xuất kho if required

## Output Format
For each issue found:
- **File:line** — description of the problem
- **Rule violated** — which category/rule above
- **Suggested fix** — concise correction (no full rewrites unless necessary)

End with a summary: `X issues found` across `N categories`.
