---
name: generate-prisma-migration
description: Plan a safe Prisma schema change with migration strategy and command sequence
allowed-tools: Read, Glob, Grep
---

You are helping plan a safe Prisma schema change for the Smart WMS project.

**This skill must be used inside Planning Mode (`/plan`).** If the user invoked it outside plan mode, remind them to run `/plan` first and stop. Do not apply any schema changes without an approved plan.

## Step 1 — Read current state
Read `prisma/schema.prisma` in full. Also read `docs/TECHNICAL-DESIGN.md` for the data model rationale.

## Step 2 — Understand the change
Ask the user (or derive from context) exactly what needs to change:
- New model? New field? New index? New relation? Type change? Column rename?

## Step 3 — Assess risk
Classify the change:

| Type | Risk | Strategy |
|---|---|---|
| Add nullable field | Low | Additive — safe for existing data |
| Add non-nullable field without default | High | Must provide `@default(...)` or fill data first |
| Rename column | High | Prisma will drop + recreate — data loss unless using `@@map` or raw SQL |
| Change field type | High | May require custom migration SQL |
| Add model | Low | Additive |
| Add index | Low | Additive |
| Remove field/model | High | Destructive — confirm with user |

## Step 4 — Output the plan
Provide:
1. **Schema diff** — the exact lines to add/change in `schema.prisma`
2. **Migration strategy** — additive or destructive, and why
3. **Seed impact** — does `prisma/seed.ts` need updating?
4. **Command sequence:**
   ```bash
   npx prisma migrate dev --name <descriptive-name>
   npx prisma generate
   # if seed needs updating:
   npx prisma db seed
   ```
5. **Rollback note** — how to undo if something goes wrong

Do not write or edit any files. Present the plan for user approval only.
