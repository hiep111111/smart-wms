---
name: generate-component
description: Create a UI component following Smart WMS project patterns (Tailwind v4, TypeScript strict, Vietnamese labels)
allowed-tools: Read, Write, Edit, Glob, Grep
---

You are generating a React UI component for the Smart WMS project.

## Step 1 — Read the canonical pattern
Read `src/components/kho/WarehouseMap.tsx` as the reference implementation. Note:
- How props are typed (explicit TypeScript interfaces, no `any`)
- How Tailwind classes are applied
- How Vietnamese labels are used
- Whether it is a Client or Server Component

Also read `docs/MODULE-STRUCTURE.md` to determine which module the new component belongs to, and which folder it should live in under `src/components/`.

## Step 2 — Determine component type
Default to **React Server Component (RSC)** unless the component needs:
- Event handlers (onClick, onChange, etc.)
- React hooks (useState, useEffect, etc.)
- Browser-only APIs (window, navigator, etc.)

Only add `"use client"` at the top when one of the above is required.

## Step 3 — Generate the component
Follow these rules:
- **Named export only** — `export function ComponentName(...)` — no default export (except page/layout files)
- **Tailwind v4 only** — no external component libraries, no inline styles
- **TypeScript strict** — define a `type Props = { ... }` or `interface Props { ... }` for all props, no `any`
- **Vietnamese UI labels** — follow existing conventions (e.g., "Trống", "Đầy", "Nhập kho", "Xuất kho")
- **No comments** unless the logic is non-obvious
- **Minimal complexity** — only implement what was asked, no speculative features

## Step 4 — Place the file
Put the file in the correct module folder under `src/components/`. Report the file path created.
