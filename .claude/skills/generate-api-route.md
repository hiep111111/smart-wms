---
name: generate-api-route
description: Scaffold a Next.js API route handler following the API-INTERFACE.md contract
allowed-tools: Read, Write, Edit, Glob, Grep
---

You are generating a Next.js 15 App Router route handler for the Smart WMS project.

## Step 1 — Read the contract
Read `docs/API-INTERFACE.md` to find the endpoint specification for the module requested by the user. This is the source of truth for:
- URL path (`/api/v1/<module>`)
- HTTP method(s)
- Request body / query params
- Response shape
- Applicable error codes

## Step 2 — Locate existing patterns
Grep `src/app/api/` for any existing route files and read one as a pattern reference. Also read the relevant Server Action in `src/actions/` — the route handler must call the action, not re-implement business logic.

## Step 3 — Scaffold the route
Create `src/app/api/v1/<module>/route.ts` following these rules:

**Response envelope (always):**
```ts
// Success
NextResponse.json({ success: true, data: result }, { status: 200 })

// Error
NextResponse.json({ success: false, error: { code: "ERROR_CODE", message: "..." } }, { status: 4xx })
```

**Auth guard (every route):**
```ts
const session = await getSession()
if (!session) return unauthorized()
if (!hasPermission(session, "required:permission")) return forbidden()
```

**Rules:**
- No `any` — type all request bodies explicitly
- Validate input manually (no Zod dependency unless already installed)
- Map business errors to the correct HTTP status codes from `docs/API-INTERFACE.md`
- Do not duplicate DB logic — delegate to the module's Server Action
- Use `NextResponse` from `next/server`

## Step 4 — Report
List the file created and the endpoint it implements.
