---
name: run-tests
description: Run lint and build checks, then diagnose and fix any failures
allowed-tools: Bash, Read, Edit, Grep
---

You are running the Smart WMS quality checks and fixing any failures.

## Step 1 — Lint
Run:
```bash
npm run lint
```
Fix all ESLint errors before continuing. Read the flagged files, apply minimal fixes, re-run lint to confirm clean.

## Step 2 — Type check + Build
Run:
```bash
npm run build
```
This catches TypeScript errors and build failures. If there are Prisma type errors, run `npx prisma generate` first, then retry.

## Step 3 — Diagnose failures
For each failure:
1. Read the full error message — identify the file and line
2. Read the failing file to understand the context
3. Identify the root cause (type error, missing import, schema mismatch, etc.)
4. Apply the **minimal fix** — do not refactor surrounding code, do not add features

## Step 4 — Re-run to confirm green
After all fixes, re-run both commands:
```bash
npm run lint && npm run build
```
Confirm both exit with code 0.

## Step 5 — Report
Summarize:
- Commands run
- Failures found (file:line, error type)
- Fixes applied (file:line, what changed)
- Final status: PASS / FAIL

**Rules:**
- Never skip lint errors by disabling ESLint rules unless explicitly instructed
- Never use `as any` or `// @ts-ignore` to silence type errors — fix the root cause
- Do not refactor code that wasn't directly causing a failure
