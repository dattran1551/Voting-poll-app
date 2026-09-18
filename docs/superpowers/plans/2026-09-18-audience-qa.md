# Audience Q&A (VNGGames ON) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the 3-screen Audience Q&A web app (Display, Employee, Admin) for VNGGames ON (07/10/2026), per the approved spec.

**Architecture:** Single Next.js (App Router, TypeScript) project containing both the UI and the backend API routes. PostgreSQL (any standard host — Neon/Supabase/etc via `DATABASE_URL`) stores questions, likes, and active-device heartbeats. All three screens poll the API every few seconds instead of using a live socket connection.

**Tech Stack:** Next.js 15 (App Router, TypeScript), PostgreSQL via the `pg` driver, Tailwind CSS, `sonner` (toasts), `qrcode` (QR generation), `exceljs` (Excel export), Vitest + `@testing-library/react` + `pg-mem` (tests), deployed on Vercel.

**Spec:** `docs/superpowers/specs/2026-09-17-audience-qa-design.md`

## Global Constraints

- No login/authentication anywhere except the Admin route's secret token embedded in its URL.
- Every fixed UI string appears in both Vietnamese and English simultaneously ("Tiếng Việt / English"), no language toggle.
- Question text max length: 300 characters.
- Capacity limit: 500 concurrently-active devices on the Employee screen only.
- "Active" = a heartbeat received within the last 30 seconds. No heartbeat for 30+ seconds = inactive (slot freed).
- All screens poll for fresh data every few seconds; no websockets.
- Display screen never shows error banners — on a failed refresh it silently keeps the last known list and retries.
- Excel export always includes every question in every status.
- Visual style must be pulled from the real VNGGames ON Figma file (`https://www.figma.com/design/KprMCUGsAJYHAl5Dpd81ov/GamesOn`), not invented — per [[vnggameson-figma-fidelity]] standing project rule.

---

## Task 1: Project scaffolding

**Files:**
- Create: `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `postcss.config.mjs`
- Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`
- Create: `.env.example`
- Create: `.gitignore`
- Create: `vitest.config.ts`

**Interfaces:**
- Produces: a runnable Next.js app (`npm run dev`), a working test runner (`npm test`).

- [ ] **Step 1: Scaffold the Next.js app**

```bash
npx create-next-app@latest . --typescript --tailwind --app --no-src-dir --import-alias "@/*" --eslint
```

When prompted, accept defaults. This creates `package.json`, `tsconfig.json`, `next.config.ts`, `tailwind.config.ts`, `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `.gitignore`, `eslint.config.mjs`.

- [ ] **Step 2: Install runtime dependencies**

```bash
npm install pg qrcode exceljs sonner
npm install -D @types/pg @types/qrcode vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom pg-mem
```

- [ ] **Step 3: Create `.env.example`**

```
DATABASE_URL=postgres://user:password@host:5432/dbname
ADMIN_SECRET_TOKEN=replace-with-a-long-random-string
```

- [ ] **Step 4: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
```

- [ ] **Step 5: Create `vitest.setup.ts`**

```ts
import '@testing-library/jest-dom/vitest'
```

- [ ] **Step 6: Add test script to `package.json`**

Edit the `"scripts"` section of `package.json` to add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 7: Verify the app boots**

Run: `npm run dev` in the background, then `curl -s -o /dev/null -w "%{http_code}" http://localhost:3000`
Expected: `200`. Stop the dev server after confirming.

- [ ] **Step 8: Commit**

```bash
git add -A
git commit -m "chore: scaffold Next.js project with test tooling"
```

---

## Task 2: Database types, connection, and schema

**Files:**
- Create: `lib/types.ts`
- Create: `lib/db.ts`
- Create: `schema.sql`
- Create: `lib/test-db.ts`
- Test: `lib/test-db.test.ts`

**Interfaces:**
- Produces: `QuestionStatus` type, `Question` interface, `QueryExecutor` interface, `pool: QueryExecutor` (real DB), `createTestPool(): Promise<QueryExecutor>` (in-memory DB pre-loaded with schema, for tests).

- [ ] **Step 1: Write `lib/types.ts`**

```ts
export type QuestionStatus = 'pending' | 'approved' | 'rejected' | 'answered'

export interface Question {
  id: string
  content: string
  status: QuestionStatus
  likeCount: number
  createdAt: string
}

export interface QueryExecutor {
  query<T = Record<string, unknown>>(text: string, params?: unknown[]): Promise<{ rows: T[] }>
}
```

- [ ] **Step 2: Write `schema.sql`**

```sql
CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS likes (
  question_id TEXT NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (question_id, device_id)
);

CREATE TABLE IF NOT EXISTS active_devices (
  device_id TEXT PRIMARY KEY,
  last_seen TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

- [ ] **Step 3: Write `lib/db.ts`**

```ts
import { Pool } from 'pg'
import type { QueryExecutor } from './types'

let pool: QueryExecutor | undefined

export function getPool(): QueryExecutor {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is required')
    }
    pool = new Pool({ connectionString })
  }
  return pool
}
```

- [ ] **Step 4: Write the failing test `lib/test-db.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import { createTestPool } from './test-db'

describe('createTestPool', () => {
  it('creates a pool with the schema already applied', async () => {
    const db = await createTestPool()
    const result = await db.query('SELECT * FROM questions')
    expect(result.rows).toEqual([])
  })
})
```

- [ ] **Step 5: Run test to verify it fails**

Run: `npx vitest run lib/test-db.test.ts`
Expected: FAIL — `Cannot find module './test-db'`

- [ ] **Step 6: Write `lib/test-db.ts`**

```ts
import { newDb } from 'pg-mem'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import type { QueryExecutor } from './types'

export async function createTestPool(): Promise<QueryExecutor> {
  const db = newDb()
  const { Pool } = db.adapters.createPg()
  const pool = new Pool() as unknown as QueryExecutor
  const schema = readFileSync(path.join(__dirname, '..', 'schema.sql'), 'utf-8')
  await pool.query(schema)
  return pool
}
```

- [ ] **Step 7: Run test to verify it passes**

Run: `npx vitest run lib/test-db.test.ts`
Expected: PASS

- [ ] **Step 8: Commit**

```bash
git add lib/types.ts lib/db.ts lib/test-db.ts lib/test-db.test.ts schema.sql
git commit -m "feat: add database schema, connection pool, and in-memory test pool"
```

---

## Task 3: Questions data-access layer

**Files:**
- Create: `lib/questions.ts`
- Test: `lib/questions.test.ts`

**Interfaces:**
- Consumes: `QueryExecutor`, `Question`, `QuestionStatus` from `lib/types.ts`; `createTestPool` from `lib/test-db.ts`.
- Produces: `createQuestion(db, content): Promise<Question>`, `getApprovedQuestions(db): Promise<Question[]>`, `getPendingQuestions(db): Promise<Question[]>`, `updateQuestionStatus(db, id, status): Promise<Question | null>`, `getAllQuestions(db): Promise<Question[]>`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestPool } from './test-db'
import { createQuestion, getApprovedQuestions, getPendingQuestions, updateQuestionStatus, getAllQuestions } from './questions'
import type { QueryExecutor } from './types'

let db: QueryExecutor

beforeEach(async () => {
  db = await createTestPool()
})

describe('createQuestion', () => {
  it('creates a pending question with zero likes', async () => {
    const question = await createQuestion(db, 'Khi nào có bonus?')
    expect(question.content).toBe('Khi nào có bonus?')
    expect(question.status).toBe('pending')
    expect(question.likeCount).toBe(0)
    expect(question.id).toBeTruthy()
  })
})

describe('getApprovedQuestions', () => {
  it('returns only approved questions, most-liked first, oldest-first on ties', async () => {
    const a = await createQuestion(db, 'Question A')
    const b = await createQuestion(db, 'Question B')
    await createQuestion(db, 'Question C (still pending)')
    await updateQuestionStatus(db, a.id, 'approved')
    await updateQuestionStatus(db, b.id, 'approved')
    await db.query('INSERT INTO likes (question_id, device_id) VALUES ($1, $2)', [b.id, 'device-1'])

    const result = await getApprovedQuestions(db)

    expect(result.map((q) => q.id)).toEqual([b.id, a.id])
    expect(result[0].likeCount).toBe(1)
    expect(result[1].likeCount).toBe(0)
  })

  it('excludes answered questions', async () => {
    const a = await createQuestion(db, 'Question A')
    await updateQuestionStatus(db, a.id, 'approved')
    await updateQuestionStatus(db, a.id, 'answered')

    const result = await getApprovedQuestions(db)

    expect(result).toEqual([])
  })
})

describe('getPendingQuestions', () => {
  it('returns pending questions oldest-first', async () => {
    const a = await createQuestion(db, 'First')
    const b = await createQuestion(db, 'Second')

    const result = await getPendingQuestions(db)

    expect(result.map((q) => q.id)).toEqual([a.id, b.id])
  })
})

describe('updateQuestionStatus', () => {
  it('updates the status and returns the updated question', async () => {
    const a = await createQuestion(db, 'Question A')
    const updated = await updateQuestionStatus(db, a.id, 'rejected')
    expect(updated?.status).toBe('rejected')
  })

  it('returns null for an unknown id', async () => {
    const updated = await updateQuestionStatus(db, 'does-not-exist', 'approved')
    expect(updated).toBeNull()
  })
})

describe('getAllQuestions', () => {
  it('returns every question regardless of status', async () => {
    const a = await createQuestion(db, 'A')
    await updateQuestionStatus(db, a.id, 'rejected')
    await createQuestion(db, 'B')

    const result = await getAllQuestions(db)

    expect(result).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/questions.test.ts`
Expected: FAIL — `Cannot find module './questions'`

- [ ] **Step 3: Write `lib/questions.ts`**

```ts
import { randomUUID } from 'node:crypto'
import type { QueryExecutor, Question, QuestionStatus } from './types'

interface QuestionRow {
  id: string
  content: string
  status: QuestionStatus
  created_at: string
  like_count: string | number
}

function toQuestion(row: QuestionRow): Question {
  return {
    id: row.id,
    content: row.content,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString(),
    likeCount: Number(row.like_count),
  }
}

export async function createQuestion(db: QueryExecutor, content: string): Promise<Question> {
  const id = randomUUID()
  const result = await db.query<QuestionRow>(
    `INSERT INTO questions (id, content, status)
     VALUES ($1, $2, 'pending')
     RETURNING id, content, status, created_at, 0 AS like_count`,
    [id, content]
  )
  return toQuestion(result.rows[0])
}

const SELECT_WITH_LIKES = `
  SELECT q.id, q.content, q.status, q.created_at, COUNT(l.device_id)::int AS like_count
  FROM questions q
  LEFT JOIN likes l ON l.question_id = q.id
`

export async function getApprovedQuestions(db: QueryExecutor): Promise<Question[]> {
  const result = await db.query<QuestionRow>(
    `${SELECT_WITH_LIKES}
     WHERE q.status = 'approved'
     GROUP BY q.id
     ORDER BY like_count DESC, q.created_at ASC`
  )
  return result.rows.map(toQuestion)
}

export async function getPendingQuestions(db: QueryExecutor): Promise<Question[]> {
  const result = await db.query<QuestionRow>(
    `${SELECT_WITH_LIKES}
     WHERE q.status = 'pending'
     GROUP BY q.id
     ORDER BY q.created_at ASC`
  )
  return result.rows.map(toQuestion)
}

export async function getAllQuestions(db: QueryExecutor): Promise<Question[]> {
  const result = await db.query<QuestionRow>(
    `${SELECT_WITH_LIKES}
     GROUP BY q.id
     ORDER BY q.created_at ASC`
  )
  return result.rows.map(toQuestion)
}

export async function updateQuestionStatus(
  db: QueryExecutor,
  id: string,
  status: QuestionStatus
): Promise<Question | null> {
  const result = await db.query<{ id: string }>(
    `UPDATE questions SET status = $2 WHERE id = $1 RETURNING id`,
    [id, status]
  )
  if (result.rows.length === 0) {
    return null
  }
  const withLikes = await db.query<QuestionRow>(
    `${SELECT_WITH_LIKES} WHERE q.id = $1 GROUP BY q.id`,
    [id]
  )
  return toQuestion(withLikes.rows[0])
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/questions.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/questions.ts lib/questions.test.ts
git commit -m "feat: add questions data-access layer"
```

---

## Task 4: Likes data-access layer

**Files:**
- Create: `lib/likes.ts`
- Test: `lib/likes.test.ts`

**Interfaces:**
- Consumes: `QueryExecutor` from `lib/types.ts`, `createQuestion`/`getApprovedQuestions` from `lib/questions.ts` (tests only).
- Produces: `likeQuestion(db, questionId, deviceId): Promise<{ likeCount: number; alreadyLiked: boolean }>`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestPool } from './test-db'
import { createQuestion, updateQuestionStatus, getApprovedQuestions } from './questions'
import { likeQuestion } from './likes'
import type { QueryExecutor } from './types'

let db: QueryExecutor

beforeEach(async () => {
  db = await createTestPool()
})

describe('likeQuestion', () => {
  it('increments the like count for a first-time like', async () => {
    const q = await createQuestion(db, 'Question A')
    await updateQuestionStatus(db, q.id, 'approved')

    const result = await likeQuestion(db, q.id, 'device-1')

    expect(result).toEqual({ likeCount: 1, alreadyLiked: false })
  })

  it('is idempotent: liking twice from the same device does not double-count', async () => {
    const q = await createQuestion(db, 'Question A')
    await updateQuestionStatus(db, q.id, 'approved')

    await likeQuestion(db, q.id, 'device-1')
    const result = await likeQuestion(db, q.id, 'device-1')

    expect(result).toEqual({ likeCount: 1, alreadyLiked: true })
    const [approved] = await getApprovedQuestions(db)
    expect(approved.likeCount).toBe(1)
  })

  it('counts likes from different devices separately', async () => {
    const q = await createQuestion(db, 'Question A')
    await updateQuestionStatus(db, q.id, 'approved')

    await likeQuestion(db, q.id, 'device-1')
    const result = await likeQuestion(db, q.id, 'device-2')

    expect(result).toEqual({ likeCount: 2, alreadyLiked: false })
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/likes.test.ts`
Expected: FAIL — `Cannot find module './likes'`

- [ ] **Step 3: Write `lib/likes.ts`**

```ts
import type { QueryExecutor } from './types'

export async function likeQuestion(
  db: QueryExecutor,
  questionId: string,
  deviceId: string
): Promise<{ likeCount: number; alreadyLiked: boolean }> {
  const existing = await db.query(
    'SELECT 1 FROM likes WHERE question_id = $1 AND device_id = $2',
    [questionId, deviceId]
  )
  const alreadyLiked = existing.rows.length > 0

  if (!alreadyLiked) {
    await db.query(
      'INSERT INTO likes (question_id, device_id) VALUES ($1, $2)',
      [questionId, deviceId]
    )
  }

  const countResult = await db.query<{ count: number }>(
    'SELECT COUNT(*)::int AS count FROM likes WHERE question_id = $1',
    [questionId]
  )

  return { likeCount: Number(countResult.rows[0].count), alreadyLiked }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/likes.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/likes.ts lib/likes.test.ts
git commit -m "feat: add idempotent like data-access layer"
```

---

## Task 5: Capacity (heartbeat) data-access layer

**Files:**
- Create: `lib/capacity.ts`
- Test: `lib/capacity.test.ts`

**Interfaces:**
- Consumes: `QueryExecutor` from `lib/types.ts`.
- Produces: `CAPACITY_LIMIT: number`, `ACTIVE_WINDOW_MS: number`, `heartbeat(db, deviceId, now?: Date): Promise<{ allowed: boolean }>`, `countActive(db, now?: Date): Promise<number>`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { createTestPool } from './test-db'
import { heartbeat, countActive, CAPACITY_LIMIT } from './capacity'
import type { QueryExecutor } from './types'

let db: QueryExecutor

beforeEach(async () => {
  db = await createTestPool()
})

describe('heartbeat', () => {
  it('allows a new device when under capacity', async () => {
    const result = await heartbeat(db, 'device-1')
    expect(result.allowed).toBe(true)
    expect(await countActive(db)).toBe(1)
  })

  it('keeps an already-active device active on repeat heartbeats', async () => {
    const now = new Date('2026-10-07T10:00:00Z')
    await heartbeat(db, 'device-1', now)
    const later = new Date(now.getTime() + 10_000)
    const result = await heartbeat(db, 'device-1', later)
    expect(result.allowed).toBe(true)
    expect(await countActive(db, later)).toBe(1)
  })

  it('treats a device silent for over 30s as inactive, freeing its slot', async () => {
    const now = new Date('2026-10-07T10:00:00Z')
    await heartbeat(db, 'device-1', now)
    const later = new Date(now.getTime() + 31_000)
    expect(await countActive(db, later)).toBe(0)
  })

  it('rejects a new device once capacity is full', async () => {
    const now = new Date('2026-10-07T10:00:00Z')
    for (let i = 0; i < CAPACITY_LIMIT; i++) {
      await heartbeat(db, `device-${i}`, now)
    }
    const result = await heartbeat(db, 'device-overflow', now)
    expect(result.allowed).toBe(false)
    expect(await countActive(db, now)).toBe(CAPACITY_LIMIT)
  })

  it('admits a waiting device once a slot frees up', async () => {
    const now = new Date('2026-10-07T10:00:00Z')
    for (let i = 0; i < CAPACITY_LIMIT; i++) {
      await heartbeat(db, `device-${i}`, now)
    }
    const later = new Date(now.getTime() + 31_000)
    const result = await heartbeat(db, 'device-overflow', later)
    expect(result.allowed).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/capacity.test.ts`
Expected: FAIL — `Cannot find module './capacity'`

- [ ] **Step 3: Write `lib/capacity.ts`**

```ts
import type { QueryExecutor } from './types'

export const CAPACITY_LIMIT = 500
export const ACTIVE_WINDOW_MS = 30_000

export async function countActive(db: QueryExecutor, now: Date = new Date()): Promise<number> {
  const cutoff = new Date(now.getTime() - ACTIVE_WINDOW_MS)
  const result = await db.query<{ count: number }>(
    'SELECT COUNT(*)::int AS count FROM active_devices WHERE last_seen > $1',
    [cutoff]
  )
  return Number(result.rows[0].count)
}

export async function heartbeat(
  db: QueryExecutor,
  deviceId: string,
  now: Date = new Date()
): Promise<{ allowed: boolean }> {
  const cutoff = new Date(now.getTime() - ACTIVE_WINDOW_MS)

  const existing = await db.query(
    'SELECT device_id FROM active_devices WHERE device_id = $1 AND last_seen > $2',
    [deviceId, cutoff]
  )

  if (existing.rows.length > 0) {
    await db.query('UPDATE active_devices SET last_seen = $2 WHERE device_id = $1', [deviceId, now])
    return { allowed: true }
  }

  const activeCount = await countActive(db, now)
  if (activeCount >= CAPACITY_LIMIT) {
    return { allowed: false }
  }

  await db.query(
    `INSERT INTO active_devices (device_id, last_seen) VALUES ($1, $2)
     ON CONFLICT (device_id) DO UPDATE SET last_seen = $2`,
    [deviceId, now]
  )
  return { allowed: true }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/capacity.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/capacity.ts lib/capacity.test.ts
git commit -m "feat: add 30s-window capacity/heartbeat data-access layer"
```

---

## Task 6: Public API routes — submit and list approved questions

**Files:**
- Create: `app/api/questions/route.ts`
- Test: `app/api/questions/route.test.ts`

**Interfaces:**
- Consumes: `getPool` from `lib/db.ts`, `createQuestion`/`getApprovedQuestions` from `lib/questions.ts`.
- Produces: `GET /api/questions` → `{ questions: Question[] }`; `POST /api/questions` (body `{ content: string }`) → `201 { question: Question }` or `400 { error: 'invalid_content' }`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QueryExecutor } from '@/lib/types'

const mockDb: QueryExecutor = { query: vi.fn() }
vi.mock('@/lib/db', () => ({ getPool: () => mockDb }))

import * as questions from '@/lib/questions'
import { GET, POST } from './route'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('GET /api/questions', () => {
  it('returns approved questions from the data layer', async () => {
    vi.spyOn(questions, 'getApprovedQuestions').mockResolvedValue([
      { id: '1', content: 'Q1', status: 'approved', likeCount: 3, createdAt: '2026-10-07T00:00:00.000Z' },
    ])

    const response = await GET()
    const body = await response.json()

    expect(body.questions).toHaveLength(1)
    expect(body.questions[0].content).toBe('Q1')
  })
})

describe('POST /api/questions', () => {
  it('creates a question when content is valid', async () => {
    vi.spyOn(questions, 'createQuestion').mockResolvedValue({
      id: '1', content: 'Hello', status: 'pending', likeCount: 0, createdAt: '2026-10-07T00:00:00.000Z',
    })

    const request = new Request('http://localhost/api/questions', {
      method: 'POST',
      body: JSON.stringify({ content: 'Hello' }),
    })
    const response = await POST(request as never)

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.question.content).toBe('Hello')
  })

  it('rejects empty content', async () => {
    const request = new Request('http://localhost/api/questions', {
      method: 'POST',
      body: JSON.stringify({ content: '   ' }),
    })
    const response = await POST(request as never)
    expect(response.status).toBe(400)
  })

  it('rejects content over 300 characters', async () => {
    const request = new Request('http://localhost/api/questions', {
      method: 'POST',
      body: JSON.stringify({ content: 'a'.repeat(301) }),
    })
    const response = await POST(request as never)
    expect(response.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run app/api/questions/route.test.ts`
Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: Write `app/api/questions/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { createQuestion, getApprovedQuestions } from '@/lib/questions'

export async function GET() {
  const questions = await getApprovedQuestions(getPool())
  return NextResponse.json({ questions })
}

export async function POST(request: Request) {
  const body = await request.json()
  const content = typeof body.content === 'string' ? body.content.trim() : ''

  if (!content || content.length > 300) {
    return NextResponse.json({ error: 'invalid_content' }, { status: 400 })
  }

  const question = await createQuestion(getPool(), content)
  return NextResponse.json({ question }, { status: 201 })
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/api/questions/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/questions/route.ts app/api/questions/route.test.ts
git commit -m "feat: add public questions list/submit API route"
```

---

## Task 7: Like API route

**Files:**
- Create: `app/api/questions/[id]/like/route.ts`
- Test: `app/api/questions/[id]/like/route.test.ts`

**Interfaces:**
- Consumes: `getPool` from `lib/db.ts`, `likeQuestion` from `lib/likes.ts`.
- Produces: `POST /api/questions/:id/like` (body `{ deviceId: string }`) → `200 { likeCount: number; alreadyLiked: boolean }` or `400 { error: 'missing_device_id' }`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QueryExecutor } from '@/lib/types'

const mockDb: QueryExecutor = { query: vi.fn() }
vi.mock('@/lib/db', () => ({ getPool: () => mockDb }))

import * as likes from '@/lib/likes'
import { POST } from './route'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('POST /api/questions/[id]/like', () => {
  it('likes the question for the given device', async () => {
    vi.spyOn(likes, 'likeQuestion').mockResolvedValue({ likeCount: 4, alreadyLiked: false })

    const request = new Request('http://localhost/api/questions/q1/like', {
      method: 'POST',
      body: JSON.stringify({ deviceId: 'device-1' }),
    })
    const response = await POST(request as never, { params: Promise.resolve({ id: 'q1' }) })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toEqual({ likeCount: 4, alreadyLiked: false })
    expect(likes.likeQuestion).toHaveBeenCalledWith(mockDb, 'q1', 'device-1')
  })

  it('rejects a request with no deviceId', async () => {
    const request = new Request('http://localhost/api/questions/q1/like', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const response = await POST(request as never, { params: Promise.resolve({ id: 'q1' }) })
    expect(response.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run app/api/questions/\[id\]/like/route.test.ts`
Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: Write `app/api/questions/[id]/like/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { likeQuestion } from '@/lib/likes'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const deviceId = typeof body.deviceId === 'string' ? body.deviceId : ''

  if (!deviceId) {
    return NextResponse.json({ error: 'missing_device_id' }, { status: 400 })
  }

  const result = await likeQuestion(getPool(), id, deviceId)
  return NextResponse.json(result)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/api/questions/\[id\]/like/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add "app/api/questions/[id]/like/route.ts" "app/api/questions/[id]/like/route.test.ts"
git commit -m "feat: add like API route"
```

---

## Task 8: Capacity heartbeat API route

**Files:**
- Create: `app/api/capacity/heartbeat/route.ts`
- Test: `app/api/capacity/heartbeat/route.test.ts`

**Interfaces:**
- Consumes: `getPool` from `lib/db.ts`, `heartbeat` from `lib/capacity.ts`.
- Produces: `POST /api/capacity/heartbeat` (body `{ deviceId: string }`) → `200 { allowed: boolean }` or `400 { error: 'missing_device_id' }`.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { QueryExecutor } from '@/lib/types'

const mockDb: QueryExecutor = { query: vi.fn() }
vi.mock('@/lib/db', () => ({ getPool: () => mockDb }))

import * as capacity from '@/lib/capacity'
import { POST } from './route'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('POST /api/capacity/heartbeat', () => {
  it('returns allowed=true when under capacity', async () => {
    vi.spyOn(capacity, 'heartbeat').mockResolvedValue({ allowed: true })

    const request = new Request('http://localhost/api/capacity/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ deviceId: 'device-1' }),
    })
    const response = await POST(request as never)

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ allowed: true })
  })

  it('returns allowed=false when at capacity', async () => {
    vi.spyOn(capacity, 'heartbeat').mockResolvedValue({ allowed: false })

    const request = new Request('http://localhost/api/capacity/heartbeat', {
      method: 'POST',
      body: JSON.stringify({ deviceId: 'device-501' }),
    })
    const response = await POST(request as never)

    expect(await response.json()).toEqual({ allowed: false })
  })

  it('rejects a request with no deviceId', async () => {
    const request = new Request('http://localhost/api/capacity/heartbeat', {
      method: 'POST',
      body: JSON.stringify({}),
    })
    const response = await POST(request as never)
    expect(response.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run app/api/capacity/heartbeat/route.test.ts`
Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: Write `app/api/capacity/heartbeat/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { heartbeat } from '@/lib/capacity'

export async function POST(request: Request) {
  const body = await request.json()
  const deviceId = typeof body.deviceId === 'string' ? body.deviceId : ''

  if (!deviceId) {
    return NextResponse.json({ error: 'missing_device_id' }, { status: 400 })
  }

  const result = await heartbeat(getPool(), deviceId)
  return NextResponse.json(result)
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/api/capacity/heartbeat/route.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/api/capacity/heartbeat/route.ts app/api/capacity/heartbeat/route.test.ts
git commit -m "feat: add capacity heartbeat API route"
```

---

## Task 9: Admin API routes (token-gated list + moderation actions)

**Files:**
- Create: `lib/admin-auth.ts`
- Create: `app/api/admin/[token]/questions/route.ts`
- Create: `app/api/admin/[token]/questions/[id]/route.ts`
- Test: `lib/admin-auth.test.ts`
- Test: `app/api/admin/[token]/questions/route.test.ts`
- Test: `app/api/admin/[token]/questions/[id]/route.test.ts`

**Interfaces:**
- Consumes: `getPool`, `getPendingQuestions`/`getApprovedQuestions`/`updateQuestionStatus` from `lib/questions.ts`.
- Produces: `isValidAdminToken(token: string): boolean`; `GET /api/admin/:token/questions?status=pending|approved` → `{ questions: Question[] }` or `403`; `PATCH /api/admin/:token/questions/:id` (body `{ status: 'approved'|'rejected'|'answered' }`) → `{ question: Question }`, `403`, or `404`.

- [ ] **Step 1: Write the failing test for `lib/admin-auth.ts`**

```ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isValidAdminToken } from './admin-auth'

const ORIGINAL_TOKEN = process.env.ADMIN_SECRET_TOKEN

beforeEach(() => {
  process.env.ADMIN_SECRET_TOKEN = 'correct-token'
})

afterEach(() => {
  process.env.ADMIN_SECRET_TOKEN = ORIGINAL_TOKEN
})

describe('isValidAdminToken', () => {
  it('returns true for the configured token', () => {
    expect(isValidAdminToken('correct-token')).toBe(true)
  })

  it('returns false for any other value', () => {
    expect(isValidAdminToken('guess')).toBe(false)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/admin-auth.test.ts`
Expected: FAIL — `Cannot find module './admin-auth'`

- [ ] **Step 3: Write `lib/admin-auth.ts`**

```ts
export function isValidAdminToken(token: string): boolean {
  const expected = process.env.ADMIN_SECRET_TOKEN
  return Boolean(expected) && token === expected
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/admin-auth.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing tests for the admin questions list route**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { QueryExecutor } from '@/lib/types'

const mockDb: QueryExecutor = { query: vi.fn() }
vi.mock('@/lib/db', () => ({ getPool: () => mockDb }))

import * as questions from '@/lib/questions'
import { GET } from './route'

const ORIGINAL_TOKEN = process.env.ADMIN_SECRET_TOKEN

beforeEach(() => {
  process.env.ADMIN_SECRET_TOKEN = 'correct-token'
  vi.restoreAllMocks()
})

afterEach(() => {
  process.env.ADMIN_SECRET_TOKEN = ORIGINAL_TOKEN
})

describe('GET /api/admin/[token]/questions', () => {
  it('returns pending questions for a valid token and status=pending', async () => {
    vi.spyOn(questions, 'getPendingQuestions').mockResolvedValue([
      { id: '1', content: 'Q1', status: 'pending', likeCount: 0, createdAt: '2026-10-07T00:00:00.000Z' },
    ])

    const request = new Request('http://localhost/api/admin/correct-token/questions?status=pending')
    const response = await GET(request as never, { params: Promise.resolve({ token: 'correct-token' }) })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.questions).toHaveLength(1)
  })

  it('returns 403 for an invalid token', async () => {
    const request = new Request('http://localhost/api/admin/wrong-token/questions?status=pending')
    const response = await GET(request as never, { params: Promise.resolve({ token: 'wrong-token' }) })
    expect(response.status).toBe(403)
  })
})
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `npx vitest run "app/api/admin/\[token\]/questions/route.test.ts"`
Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 7: Write `app/api/admin/[token]/questions/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getPendingQuestions, getApprovedQuestions } from '@/lib/questions'
import { isValidAdminToken } from '@/lib/admin-auth'

export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!isValidAdminToken(token)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const url = new URL(request.url)
  const status = url.searchParams.get('status')

  const questions = status === 'approved'
    ? await getApprovedQuestions(getPool())
    : await getPendingQuestions(getPool())

  return NextResponse.json({ questions })
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run "app/api/admin/\[token\]/questions/route.test.ts"`
Expected: PASS

- [ ] **Step 9: Write the failing tests for the moderation-action route**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { QueryExecutor } from '@/lib/types'

const mockDb: QueryExecutor = { query: vi.fn() }
vi.mock('@/lib/db', () => ({ getPool: () => mockDb }))

import * as questions from '@/lib/questions'
import { PATCH } from './route'

const ORIGINAL_TOKEN = process.env.ADMIN_SECRET_TOKEN

beforeEach(() => {
  process.env.ADMIN_SECRET_TOKEN = 'correct-token'
  vi.restoreAllMocks()
})

afterEach(() => {
  process.env.ADMIN_SECRET_TOKEN = ORIGINAL_TOKEN
})

function patchRequest(status: string) {
  return new Request('http://localhost/api/admin/correct-token/questions/q1', {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

describe('PATCH /api/admin/[token]/questions/[id]', () => {
  it('approves a question', async () => {
    vi.spyOn(questions, 'updateQuestionStatus').mockResolvedValue({
      id: 'q1', content: 'Q1', status: 'approved', likeCount: 0, createdAt: '2026-10-07T00:00:00.000Z',
    })

    const response = await PATCH(patchRequest('approved') as never, {
      params: Promise.resolve({ token: 'correct-token', id: 'q1' }),
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.question.status).toBe('approved')
  })

  it('returns 403 for an invalid token', async () => {
    const response = await PATCH(patchRequest('approved') as never, {
      params: Promise.resolve({ token: 'wrong-token', id: 'q1' }),
    })
    expect(response.status).toBe(403)
  })

  it('rejects an invalid status value', async () => {
    const response = await PATCH(patchRequest('deleted') as never, {
      params: Promise.resolve({ token: 'correct-token', id: 'q1' }),
    })
    expect(response.status).toBe(400)
  })

  it('returns 404 when the question does not exist', async () => {
    vi.spyOn(questions, 'updateQuestionStatus').mockResolvedValue(null)

    const response = await PATCH(patchRequest('approved') as never, {
      params: Promise.resolve({ token: 'correct-token', id: 'missing' }),
    })
    expect(response.status).toBe(404)
  })
})
```

- [ ] **Step 10: Run tests to verify they fail**

Run: `npx vitest run "app/api/admin/\[token\]/questions/\[id\]/route.test.ts"`
Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 11: Write `app/api/admin/[token]/questions/[id]/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { updateQuestionStatus } from '@/lib/questions'
import { isValidAdminToken } from '@/lib/admin-auth'
import type { QuestionStatus } from '@/lib/types'

const VALID_STATUSES: QuestionStatus[] = ['approved', 'rejected', 'answered']

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ token: string; id: string }> }
) {
  const { token, id } = await params
  if (!isValidAdminToken(token)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = await request.json()
  const status = body.status as string

  if (!VALID_STATUSES.includes(status as QuestionStatus)) {
    return NextResponse.json({ error: 'invalid_status' }, { status: 400 })
  }

  const question = await updateQuestionStatus(getPool(), id, status as QuestionStatus)
  if (!question) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 })
  }

  return NextResponse.json({ question })
}
```

- [ ] **Step 12: Run tests to verify they pass**

Run: `npx vitest run "app/api/admin/\[token\]/questions/\[id\]/route.test.ts"`
Expected: PASS

- [ ] **Step 13: Commit**

```bash
git add lib/admin-auth.ts lib/admin-auth.test.ts "app/api/admin/[token]/questions"
git commit -m "feat: add token-gated admin questions list and moderation API routes"
```

---

## Task 10: Admin Excel export route

**Files:**
- Create: `lib/export.ts`
- Create: `app/api/admin/[token]/export/route.ts`
- Test: `lib/export.test.ts`
- Test: `app/api/admin/[token]/export/route.test.ts`

**Interfaces:**
- Consumes: `Question` from `lib/types.ts`, `getAllQuestions` from `lib/questions.ts`, `isValidAdminToken` from `lib/admin-auth.ts`.
- Produces: `buildQuestionsWorkbook(questions: Question[]): Promise<Buffer>`; `GET /api/admin/:token/export` → `.xlsx` file download or `403`.

- [ ] **Step 1: Write the failing test for `lib/export.ts`**

```ts
import { describe, it, expect } from 'vitest'
import ExcelJS from 'exceljs'
import { buildQuestionsWorkbook } from './export'

describe('buildQuestionsWorkbook', () => {
  it('writes one row per question with the required columns', async () => {
    const buffer = await buildQuestionsWorkbook([
      { id: '1', content: 'Khi nào có bonus?', status: 'approved', likeCount: 5, createdAt: '2026-10-07T09:00:00.000Z' },
    ])

    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(buffer)
    const sheet = workbook.worksheets[0]

    expect(sheet.getRow(1).values).toContain('Nội dung / Content')
    expect(sheet.getRow(2).getCell(1).value).toBe('Khi nào có bonus?')
    expect(sheet.getRow(2).getCell(2).value).toBe(5)
    expect(sheet.getRow(2).getCell(3).value).toBe('approved')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run lib/export.test.ts`
Expected: FAIL — `Cannot find module './export'`

- [ ] **Step 3: Write `lib/export.ts`**

```ts
import ExcelJS from 'exceljs'
import type { Question } from './types'

export async function buildQuestionsWorkbook(questions: Question[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook()
  const sheet = workbook.addWorksheet('Questions')

  sheet.columns = [
    { header: 'Nội dung / Content', key: 'content', width: 60 },
    { header: 'Số lượt thích / Likes', key: 'likeCount', width: 20 },
    { header: 'Trạng thái / Status', key: 'status', width: 20 },
    { header: 'Thời gian gửi / Submitted at', key: 'createdAt', width: 24 },
  ]

  for (const question of questions) {
    sheet.addRow({
      content: question.content,
      likeCount: question.likeCount,
      status: question.status,
      createdAt: question.createdAt,
    })
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer()
  return Buffer.from(arrayBuffer)
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run lib/export.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing test for the export route**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { QueryExecutor } from '@/lib/types'

const mockDb: QueryExecutor = { query: vi.fn() }
vi.mock('@/lib/db', () => ({ getPool: () => mockDb }))

import * as questions from '@/lib/questions'
import { GET } from './route'

const ORIGINAL_TOKEN = process.env.ADMIN_SECRET_TOKEN

beforeEach(() => {
  process.env.ADMIN_SECRET_TOKEN = 'correct-token'
  vi.restoreAllMocks()
})

afterEach(() => {
  process.env.ADMIN_SECRET_TOKEN = ORIGINAL_TOKEN
})

describe('GET /api/admin/[token]/export', () => {
  it('returns an xlsx file for a valid token', async () => {
    vi.spyOn(questions, 'getAllQuestions').mockResolvedValue([])

    const response = await GET(new Request('http://localhost/api/admin/correct-token/export') as never, {
      params: Promise.resolve({ token: 'correct-token' }),
    })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toContain('spreadsheet')
  })

  it('returns 403 for an invalid token', async () => {
    const response = await GET(new Request('http://localhost/api/admin/wrong/export') as never, {
      params: Promise.resolve({ token: 'wrong' }),
    })
    expect(response.status).toBe(403)
  })
})
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `npx vitest run "app/api/admin/\[token\]/export/route.test.ts"`
Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 7: Write `app/api/admin/[token]/export/route.ts`**

```ts
import { NextResponse } from 'next/server'
import { getPool } from '@/lib/db'
import { getAllQuestions } from '@/lib/questions'
import { isValidAdminToken } from '@/lib/admin-auth'
import { buildQuestionsWorkbook } from '@/lib/export'

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  if (!isValidAdminToken(token)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const questions = await getAllQuestions(getPool())
  const buffer = await buildQuestionsWorkbook(questions)

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="audience-qa-export.xlsx"',
    },
  })
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run "app/api/admin/\[token\]/export/route.test.ts"`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add lib/export.ts lib/export.test.ts "app/api/admin/[token]/export"
git commit -m "feat: add Excel export of all questions for admin"
```

---

## Task 11: Bilingual copy dictionary and shared UI state components

**Files:**
- Create: `lib/copy.ts`
- Create: `components/StateMessage.tsx`
- Test: `components/StateMessage.test.tsx`

**Interfaces:**
- Produces: `copy` object with all fixed bilingual strings; `<StateMessage kind="loading" | "empty" | "error" text={string} />`.

- [ ] **Step 1: Write `lib/copy.ts`**

```ts
export const copy = {
  display: {
    qrHint: 'Quét mã để đặt câu hỏi / Scan to ask a question',
    empty: 'Chưa có câu hỏi nào / No questions yet',
  },
  employee: {
    waiting: 'Hệ thống đang quá tải, vui lòng chờ giây lát... / System is busy, please wait a moment...',
    empty: 'Chưa có câu hỏi nào, hãy là người đặt câu hỏi đầu tiên! / No questions yet — be the first to ask!',
    submitPlaceholder: 'Nhập câu hỏi của bạn... / Type your question...',
    submitButton: 'Gửi câu hỏi / Submit',
    moderationNotice:
      'Để đảm bảo tinh thần chuyên nghiệp của sự kiện, câu hỏi của bạn sẽ được kiểm duyệt trước bởi Ban tổ chức trước khi được thể hiện lên màn hình. / To keep the event professional, your question will be reviewed by the organizers before it appears on screen.',
    submitSuccess: 'Đã gửi thành công! / Sent successfully!',
    submitFailure: 'Gửi thất bại, thử lại / Failed to send, please retry',
  },
  admin: {
    pendingTab: 'Chờ duyệt / Pending',
    approvedTab: 'Đã duyệt / Approved',
    approve: 'Duyệt / Approve',
    reject: 'Không duyệt / Reject',
    markAnswered: 'Đánh dấu đã trả lời / Mark as answered',
    exportButton: 'Xuất Excel / Export to Excel',
    exportGenerating: 'Đang tạo file... / Generating file...',
    exportFailure: 'Xuất file thất bại, thử lại / Export failed, please retry',
    pendingEmpty: 'Không có câu hỏi mới / No new questions',
    approvedEmpty: 'Chưa có câu hỏi nào được duyệt / No approved questions yet',
    actionFailure: 'Thao tác thất bại, thử lại / Action failed, please retry',
  },
  shared: {
    loading: 'Đang tải... / Loading...',
  },
} as const
```

- [ ] **Step 2: Write the failing test for `components/StateMessage.tsx`**

```tsx
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { StateMessage } from './StateMessage'

describe('StateMessage', () => {
  it('renders loading text with a loading role', () => {
    render(<StateMessage kind="loading" text="Đang tải... / Loading..." />)
    expect(screen.getByRole('status')).toHaveTextContent('Đang tải... / Loading...')
  })

  it('renders empty state text', () => {
    render(<StateMessage kind="empty" text="Chưa có câu hỏi nào / No questions yet" />)
    expect(screen.getByText('Chưa có câu hỏi nào / No questions yet')).toBeInTheDocument()
  })

  it('renders error state text with an alert role', () => {
    render(<StateMessage kind="error" text="Lỗi / Error" />)
    expect(screen.getByRole('alert')).toHaveTextContent('Lỗi / Error')
  })
})
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run components/StateMessage.test.tsx`
Expected: FAIL — `Cannot find module './StateMessage'`

- [ ] **Step 4: Write `components/StateMessage.tsx`**

```tsx
type StateMessageKind = 'loading' | 'empty' | 'error'

export function StateMessage({ kind, text }: { kind: StateMessageKind; text: string }) {
  if (kind === 'error') {
    return (
      <p role="alert" className="text-center text-sm text-neutral-500 py-8">
        {text}
      </p>
    )
  }

  if (kind === 'loading') {
    return (
      <p role="status" className="text-center text-sm text-neutral-400 py-8">
        {text}
      </p>
    )
  }

  return <p className="text-center text-sm text-neutral-400 py-8">{text}</p>
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run components/StateMessage.test.tsx`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/copy.ts components/StateMessage.tsx components/StateMessage.test.tsx
git commit -m "feat: add bilingual copy dictionary and shared state message component"
```

---

## Task 12: Device id utility

**Files:**
- Create: `lib/device-id.ts`
- Test: `lib/device-id.test.ts`

**Interfaces:**
- Produces: `getDeviceId(): string` (browser-only; persists a random id in `localStorage`).

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { getDeviceId } from './device-id'

beforeEach(() => {
  window.localStorage.clear()
})

describe('getDeviceId', () => {
  it('generates and persists a device id on first call', () => {
    const id = getDeviceId()
    expect(id).toBeTruthy()
    expect(window.localStorage.getItem('audience-qa-device-id')).toBe(id)
  })

  it('returns the same id on subsequent calls', () => {
    const first = getDeviceId()
    const second = getDeviceId()
    expect(second).toBe(first)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/device-id.test.ts`
Expected: FAIL — `Cannot find module './device-id'`

- [ ] **Step 3: Write `lib/device-id.ts`**

```ts
const DEVICE_ID_KEY = 'audience-qa-device-id'

export function getDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY)
  if (existing) {
    return existing
  }
  const id = crypto.randomUUID()
  window.localStorage.setItem(DEVICE_ID_KEY, id)
  return id
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/device-id.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/device-id.ts lib/device-id.test.ts
git commit -m "feat: add anonymous device id utility"
```

---

## Task 13: QuestionCard component

**Files:**
- Create: `components/QuestionCard.tsx`
- Test: `components/QuestionCard.test.tsx`

**Interfaces:**
- Consumes: `Question` from `lib/types.ts`.
- Produces: `<QuestionCard question={Question} likable={boolean} liked={boolean} onLike={() => void} />`.

- [ ] **Step 1: Write the failing tests**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { QuestionCard } from './QuestionCard'
import type { Question } from '@/lib/types'

const question: Question = {
  id: '1',
  content: 'Khi nào có bonus?',
  status: 'approved',
  likeCount: 3,
  createdAt: '2026-10-07T00:00:00.000Z',
}

describe('QuestionCard', () => {
  it('shows the content and like count', () => {
    render(<QuestionCard question={question} likable liked={false} onLike={() => {}} />)
    expect(screen.getByText('Khi nào có bonus?')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
  })

  it('calls onLike when the like button is pressed and not yet liked', () => {
    const onLike = vi.fn()
    render(<QuestionCard question={question} likable liked={false} onLike={onLike} />)
    fireEvent.click(screen.getByRole('button'))
    expect(onLike).toHaveBeenCalledOnce()
  })

  it('disables the like button once already liked', () => {
    const onLike = vi.fn()
    render(<QuestionCard question={question} likable liked onLike={onLike} />)
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    fireEvent.click(button)
    expect(onLike).not.toHaveBeenCalled()
  })

  it('renders no like button when likable is false (Display screen)', () => {
    render(<QuestionCard question={question} likable={false} liked={false} onLike={() => {}} />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run components/QuestionCard.test.tsx`
Expected: FAIL — `Cannot find module './QuestionCard'`

- [ ] **Step 3: Write `components/QuestionCard.tsx`**

```tsx
import type { Question } from '@/lib/types'

export function QuestionCard({
  question,
  likable,
  liked,
  onLike,
}: {
  question: Question
  likable: boolean
  liked: boolean
  onLike: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 p-4">
      <p className="flex-1 text-base">{question.content}</p>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm tabular-nums">{question.likeCount}</span>
        {likable && (
          <button
            type="button"
            aria-pressed={liked}
            disabled={liked}
            onClick={onLike}
            className="text-xl disabled:opacity-50"
          >
            ❤️
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run components/QuestionCard.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/QuestionCard.tsx components/QuestionCard.test.tsx
git commit -m "feat: add QuestionCard component shared by Display and Employee screens"
```

---

## Task 14: `useQuestionList` polling hook

**Files:**
- Create: `lib/useQuestionList.ts`
- Test: `lib/useQuestionList.test.ts`

**Interfaces:**
- Produces: `useQuestionList(options?: { silentErrors?: boolean }): { questions: Question[]; state: 'loading' | 'ready' | 'error' }` — polls `GET /api/questions` every 4 seconds.

This hook centralizes the polling behavior shared by the Display and Employee screens, including the "silently keep the last list on a failed refresh" rule from the spec.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useQuestionList } from './useQuestionList'

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useQuestionList', () => {
  it('starts in loading state then becomes ready with fetched questions', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ questions: [{ id: '1', content: 'Q', status: 'approved', likeCount: 0, createdAt: 'now' }] }),
    }) as never

    const { result } = renderHook(() => useQuestionList())
    expect(result.current.state).toBe('loading')

    await waitFor(() => expect(result.current.state).toBe('ready'))
    expect(result.current.questions).toHaveLength(1)
  })

  it('polls again after 4 seconds', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ questions: [] }),
    })
    global.fetch = fetchMock as never

    renderHook(() => useQuestionList())
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    await act(async () => {
      vi.advanceTimersByTime(4000)
    })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })

  it('keeps the last known questions and does not surface an error on a failed poll after success', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ questions: [{ id: '1', content: 'Q', status: 'approved', likeCount: 0, createdAt: 'now' }] }) })
      .mockRejectedValueOnce(new Error('network down'))
    global.fetch = fetchMock as never

    const { result } = renderHook(() => useQuestionList())
    await waitFor(() => expect(result.current.state).toBe('ready'))

    await act(async () => {
      vi.advanceTimersByTime(4000)
    })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    expect(result.current.state).toBe('ready')
    expect(result.current.questions).toHaveLength(1)
  })

  it('surfaces an error state when the very first load fails', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('network down')) as never

    const { result } = renderHook(() => useQuestionList())
    await waitFor(() => expect(result.current.state).toBe('error'))
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/useQuestionList.test.ts`
Expected: FAIL — `Cannot find module './useQuestionList'`

- [ ] **Step 3: Write `lib/useQuestionList.ts`**

```ts
import { useEffect, useRef, useState } from 'react'
import type { Question } from './types'

const POLL_INTERVAL_MS = 4000

export function useQuestionList(): { questions: Question[]; state: 'loading' | 'ready' | 'error' } {
  const [questions, setQuestions] = useState<Question[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  const hasLoadedOnce = useRef(false)

  useEffect(() => {
    let cancelled = false

    async function poll() {
      try {
        const response = await fetch('/api/questions')
        if (!response.ok) {
          throw new Error('request_failed')
        }
        const body = await response.json()
        if (cancelled) return
        setQuestions(body.questions)
        setState('ready')
        hasLoadedOnce.current = true
      } catch {
        if (cancelled) return
        if (!hasLoadedOnce.current) {
          setState('error')
        }
      }
    }

    poll()
    const timer = setInterval(poll, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(timer)
    }
  }, [])

  return { questions, state }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/useQuestionList.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/useQuestionList.ts lib/useQuestionList.test.ts
git commit -m "feat: add polling hook for the public question list"
```

---

## Task 15: Display page

**Files:**
- Create: `app/display/page.tsx`
- Test: `app/display/page.test.tsx`

**Interfaces:**
- Consumes: `useQuestionList` from `lib/useQuestionList.ts`, `QuestionCard` from `components/QuestionCard.tsx`, `StateMessage` from `components/StateMessage.tsx`, `copy` from `lib/copy.ts`, `qrcode` npm package.

- [ ] **Step 1: Write the failing tests**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import DisplayPage from './page'
import * as useQuestionListModule from '@/lib/useQuestionList'

vi.mock('@/lib/useQuestionList')

describe('DisplayPage', () => {
  it('shows a loading state on first render', () => {
    vi.spyOn(useQuestionListModule, 'useQuestionList').mockReturnValue({ questions: [], state: 'loading' })
    render(<DisplayPage />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('shows the empty-state message when there are no approved questions', () => {
    vi.spyOn(useQuestionListModule, 'useQuestionList').mockReturnValue({ questions: [], state: 'ready' })
    render(<DisplayPage />)
    expect(screen.getByText('Chưa có câu hỏi nào / No questions yet')).toBeInTheDocument()
  })

  it('renders the question list without like buttons', () => {
    vi.spyOn(useQuestionListModule, 'useQuestionList').mockReturnValue({
      questions: [{ id: '1', content: 'Q1', status: 'approved', likeCount: 2, createdAt: 'now' }],
      state: 'ready',
    })
    render(<DisplayPage />)
    expect(screen.getByText('Q1')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('keeps showing the last list and no error banner when a poll fails', () => {
    vi.spyOn(useQuestionListModule, 'useQuestionList').mockReturnValue({
      questions: [{ id: '1', content: 'Q1', status: 'approved', likeCount: 2, createdAt: 'now' }],
      state: 'error',
    })
    render(<DisplayPage />)
    expect(screen.getByText('Q1')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run app/display/page.test.tsx`
Expected: FAIL — `Cannot find module './page'`

- [ ] **Step 3: Write `app/display/page.tsx`**

```tsx
'use client'

import { useQuestionList } from '@/lib/useQuestionList'
import { QuestionCard } from '@/components/QuestionCard'
import { StateMessage } from '@/components/StateMessage'
import { copy } from '@/lib/copy'

const EMPLOYEE_URL = typeof window !== 'undefined' ? `${window.location.origin}/employee` : ''

export default function DisplayPage() {
  const { questions, state } = useQuestionList()

  return (
    <main className="flex h-screen">
      <aside className="flex w-1/3 flex-col items-center justify-center gap-4 border-r border-neutral-200 p-8">
        <img
          src={`https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(EMPLOYEE_URL)}`}
          alt="QR code"
          width={300}
          height={300}
        />
        <p className="text-center text-lg">{copy.display.qrHint}</p>
      </aside>
      <section className="flex-1 overflow-y-auto p-8">
        {state === 'loading' ? (
          <StateMessage kind="loading" text={copy.shared.loading} />
        ) : questions.length === 0 ? (
          <StateMessage kind="empty" text={copy.display.empty} />
        ) : (
          <div className="flex flex-col gap-4">
            {questions.map((question) => (
              <QuestionCard key={question.id} question={question} likable={false} liked={false} onLike={() => {}} />
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
```

Note: this uses a public QR-generation image endpoint for simplicity in the first pass; Task 20 replaces it with a locally-generated QR code via the `qrcode` package once the real Employee URL/domain is finalized.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/display/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/display/page.tsx app/display/page.test.tsx
git commit -m "feat: add Display screen with QR code and live question list"
```

---

## Task 16: Local QR code generation

**Files:**
- Create: `app/api/qr/route.ts`
- Modify: `app/display/page.tsx`
- Test: `app/api/qr/route.test.ts`

**Interfaces:**
- Consumes: `qrcode` npm package.
- Produces: `GET /api/qr?url=<encoded>` → PNG image bytes. Removes the dependency on a third-party QR image service (keeps data flow on our own server).

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from 'vitest'
import { GET } from './route'

describe('GET /api/qr', () => {
  it('returns a PNG image for a given url', async () => {
    const request = new Request('http://localhost/api/qr?url=' + encodeURIComponent('https://example.com/employee'))
    const response = await GET(request as never)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')
    const buffer = Buffer.from(await response.arrayBuffer())
    expect(buffer.length).toBeGreaterThan(0)
  })

  it('returns 400 when url is missing', async () => {
    const request = new Request('http://localhost/api/qr')
    const response = await GET(request as never)
    expect(response.status).toBe(400)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run app/api/qr/route.test.ts`
Expected: FAIL — `Cannot find module './route'`

- [ ] **Step 3: Write `app/api/qr/route.ts`**

```ts
import { NextResponse } from 'next/server'
import QRCode from 'qrcode'

export async function GET(request: Request) {
  const url = new URL(request.url).searchParams.get('url')
  if (!url) {
    return NextResponse.json({ error: 'missing_url' }, { status: 400 })
  }

  const buffer = await QRCode.toBuffer(url, { width: 400 })
  return new NextResponse(buffer, {
    status: 200,
    headers: { 'Content-Type': 'image/png' },
  })
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run app/api/qr/route.test.ts`
Expected: PASS

- [ ] **Step 5: Update `app/display/page.tsx` to use the local QR endpoint**

Replace the `<img src=... api.qrserver.com ...>` line with:

```tsx
<img src={`/api/qr?url=${encodeURIComponent(EMPLOYEE_URL)}`} alt="QR code" width={300} height={300} />
```

- [ ] **Step 6: Re-run the Display page test to confirm it still passes**

Run: `npx vitest run app/display/page.test.tsx`
Expected: PASS

- [ ] **Step 7: Commit**

```bash
git add app/api/qr/route.ts app/api/qr/route.test.ts app/display/page.tsx
git commit -m "feat: generate the QR code locally instead of via a third-party service"
```

---

## Task 17: `useCapacityGate` hook (waiting room logic)

**Files:**
- Create: `lib/useCapacityGate.ts`
- Test: `lib/useCapacityGate.test.ts`

**Interfaces:**
- Consumes: `getDeviceId` from `lib/device-id.ts`.
- Produces: `useCapacityGate(): 'checking' | 'waiting' | 'admitted'` — sends a heartbeat immediately, retries every 3s while `'waiting'`, then every 15s while `'admitted'` (well under the 30s window), and pauses sending while the page is hidden (`document.visibilityState === 'hidden'`) so an inactive tab is correctly treated as gone after 30s.

- [ ] **Step 1: Write the failing tests**

```ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useCapacityGate } from './useCapacityGate'

vi.mock('./device-id', () => ({ getDeviceId: () => 'device-1' }))

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})

afterEach(() => {
  vi.useRealTimers()
  vi.restoreAllMocks()
})

describe('useCapacityGate', () => {
  it('starts checking, then becomes admitted when the server allows it', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ allowed: true }) }) as never

    const { result } = renderHook(() => useCapacityGate())
    expect(result.current).toBe('checking')

    await waitFor(() => expect(result.current).toBe('admitted'))
  })

  it('moves to waiting when the server is at capacity, then admitted once a slot frees', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ allowed: false }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ allowed: false }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ allowed: true }) })
    global.fetch = fetchMock as never

    const { result } = renderHook(() => useCapacityGate())
    await waitFor(() => expect(result.current).toBe('waiting'))

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
    expect(result.current).toBe('waiting')

    await act(async () => {
      vi.advanceTimersByTime(3000)
    })
    await waitFor(() => expect(result.current).toBe('admitted'))
  })

  it('keeps sending heartbeats every 15s once admitted', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ allowed: true }) })
    global.fetch = fetchMock as never

    renderHook(() => useCapacityGate())
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    await act(async () => {
      vi.advanceTimersByTime(15000)
    })
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/useCapacityGate.test.ts`
Expected: FAIL — `Cannot find module './useCapacityGate'`

- [ ] **Step 3: Write `lib/useCapacityGate.ts`**

```ts
import { useEffect, useState } from 'react'
import { getDeviceId } from './device-id'

const WAITING_RETRY_MS = 3000
const ADMITTED_HEARTBEAT_MS = 15000

export function useCapacityGate(): 'checking' | 'waiting' | 'admitted' {
  const [gateState, setGateState] = useState<'checking' | 'waiting' | 'admitted'>('checking')

  useEffect(() => {
    let cancelled = false
    let timer: ReturnType<typeof setTimeout>

    async function sendHeartbeat() {
      if (document.visibilityState === 'hidden') {
        timer = setTimeout(sendHeartbeat, WAITING_RETRY_MS)
        return
      }

      try {
        const response = await fetch('/api/capacity/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deviceId: getDeviceId() }),
        })
        const body = await response.json()
        if (cancelled) return

        if (body.allowed) {
          setGateState('admitted')
          timer = setTimeout(sendHeartbeat, ADMITTED_HEARTBEAT_MS)
        } else {
          setGateState('waiting')
          timer = setTimeout(sendHeartbeat, WAITING_RETRY_MS)
        }
      } catch {
        if (cancelled) return
        timer = setTimeout(sendHeartbeat, WAITING_RETRY_MS)
      }
    }

    sendHeartbeat()

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [])

  return gateState
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/useCapacityGate.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/useCapacityGate.ts lib/useCapacityGate.test.ts
git commit -m "feat: add capacity gate hook driving the Employee waiting room"
```

---

## Task 18: Employee page — question list, likes, and waiting room

**Files:**
- Create: `app/employee/page.tsx`
- Test: `app/employee/page.test.tsx`

**Interfaces:**
- Consumes: `useCapacityGate` from `lib/useCapacityGate.ts`, `useQuestionList` from `lib/useQuestionList.ts`, `getDeviceId` from `lib/device-id.ts`, `QuestionCard`, `StateMessage`, `copy`.

- [ ] **Step 1: Write the failing tests**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import EmployeePage from './page'
import * as gateModule from '@/lib/useCapacityGate'
import * as listModule from '@/lib/useQuestionList'
import * as deviceIdModule from '@/lib/device-id'

vi.mock('@/lib/useCapacityGate')
vi.mock('@/lib/useQuestionList')
vi.mock('@/lib/device-id')

beforeEach(() => {
  vi.spyOn(deviceIdModule, 'getDeviceId').mockReturnValue('device-1')
})

describe('EmployeePage', () => {
  it('shows the waiting-room message while the capacity gate is waiting', () => {
    vi.spyOn(gateModule, 'useCapacityGate').mockReturnValue('waiting')
    vi.spyOn(listModule, 'useQuestionList').mockReturnValue({ questions: [], state: 'loading' })

    render(<EmployeePage />)

    expect(screen.getByText('Hệ thống đang quá tải, vui lòng chờ giây lát... / System is busy, please wait a moment...')).toBeInTheDocument()
  })

  it('shows the empty state once admitted with no approved questions', () => {
    vi.spyOn(gateModule, 'useCapacityGate').mockReturnValue('admitted')
    vi.spyOn(listModule, 'useQuestionList').mockReturnValue({ questions: [], state: 'ready' })

    render(<EmployeePage />)

    expect(screen.getByText('Chưa có câu hỏi nào, hãy là người đặt câu hỏi đầu tiên! / No questions yet — be the first to ask!')).toBeInTheDocument()
  })

  it('lets the user like a question and disables the button after liking', async () => {
    vi.spyOn(gateModule, 'useCapacityGate').mockReturnValue('admitted')
    vi.spyOn(listModule, 'useQuestionList').mockReturnValue({
      questions: [{ id: '1', content: 'Q1', status: 'approved', likeCount: 0, createdAt: 'now' }],
      state: 'ready',
    })
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ likeCount: 1, alreadyLiked: false }) }) as never

    render(<EmployeePage />)
    const likeButton = screen.getByRole('button', { name: '❤️' })
    fireEvent.click(likeButton)

    await screen.findByRole('button', { name: '❤️', pressed: true })
  })

  it('submits a new question and shows the char counter', () => {
    vi.spyOn(gateModule, 'useCapacityGate').mockReturnValue('admitted')
    vi.spyOn(listModule, 'useQuestionList').mockReturnValue({ questions: [], state: 'ready' })

    render(<EmployeePage />)
    const textarea = screen.getByPlaceholderText('Nhập câu hỏi của bạn... / Type your question...')
    fireEvent.change(textarea, { target: { value: 'Hello' } })

    expect(screen.getByText('295')).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run app/employee/page.test.tsx`
Expected: FAIL — `Cannot find module './page'`

- [ ] **Step 3: Write `app/employee/page.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { useCapacityGate } from '@/lib/useCapacityGate'
import { useQuestionList } from '@/lib/useQuestionList'
import { getDeviceId } from '@/lib/device-id'
import { QuestionCard } from '@/components/QuestionCard'
import { StateMessage } from '@/components/StateMessage'
import { copy } from '@/lib/copy'

const MAX_LENGTH = 300

export default function EmployeePage() {
  const gateState = useCapacityGate()
  const { questions, state } = useQuestionList()
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [draft, setDraft] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (gateState !== 'admitted') {
    return (
      <main className="flex h-screen items-center justify-center p-8">
        <StateMessage kind="loading" text={copy.employee.waiting} />
      </main>
    )
  }

  async function handleLike(questionId: string) {
    setLikedIds((prev) => new Set(prev).add(questionId))
    try {
      const response = await fetch(`/api/questions/${questionId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: getDeviceId() }),
      })
      if (!response.ok) throw new Error('like_failed')
    } catch {
      setLikedIds((prev) => {
        const next = new Set(prev)
        next.delete(questionId)
        return next
      })
    }
  }

  async function handleSubmit() {
    const content = draft.trim()
    if (!content) return

    setSubmitting(true)
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      })
      if (!response.ok) throw new Error('submit_failed')
      toast.success(copy.employee.submitSuccess)
      setDraft('')
    } catch {
      toast.error(copy.employee.submitFailure)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <main className="flex h-screen flex-col">
      <section className="flex-1 overflow-y-auto p-4">
        {state === 'loading' ? (
          <StateMessage kind="loading" text={copy.shared.loading} />
        ) : questions.length === 0 ? (
          <StateMessage kind="empty" text={copy.employee.empty} />
        ) : (
          <div className="flex flex-col gap-3">
            {questions.map((question) => (
              <QuestionCard
                key={question.id}
                question={question}
                likable
                liked={likedIds.has(question.id)}
                onLike={() => handleLike(question.id)}
              />
            ))}
          </div>
        )}
      </section>
      <section className="border-t border-neutral-200 p-4">
        <textarea
          value={draft}
          maxLength={MAX_LENGTH}
          placeholder={copy.employee.submitPlaceholder}
          onChange={(event) => setDraft(event.target.value)}
          className="w-full resize-none rounded-lg border border-neutral-300 p-2"
          rows={3}
        />
        <div className="mt-1 flex items-center justify-between">
          <span className="text-xs text-neutral-400">{MAX_LENGTH - draft.length}</span>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={submitting || !draft.trim()}
            className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
          >
            {copy.employee.submitButton}
          </button>
        </div>
        <p className="mt-2 text-xs text-neutral-400">{copy.employee.moderationNotice}</p>
      </section>
    </main>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run app/employee/page.test.tsx`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/employee/page.tsx app/employee/page.test.tsx
git commit -m "feat: add Employee screen with waiting room, likes, and question submission"
```

---

## Task 19: Wire up Sonner and bilingual metadata in the root layout

**Files:**
- Modify: `app/layout.tsx`

**Interfaces:**
- Consumes: `Toaster` from `sonner`.

- [ ] **Step 1: Edit `app/layout.tsx`**

Add the import `import { Toaster } from 'sonner'` and render `<Toaster richColors position="top-center" />` once, as a direct child of `<body>`, alongside `{children}`. Update the exported `metadata` title/description to bilingual strings, e.g. `title: 'Audience Q&A — VNGGames ON'`, `description: 'Đặt câu hỏi ẩn danh cho VNGGames ON / Ask anonymous questions for VNGGames ON'`.

- [ ] **Step 2: Verify manually**

Run: `npm run dev`, open `http://localhost:3000/employee`, submit a question, confirm a toast appears. Stop the dev server after confirming.

- [ ] **Step 3: Commit**

```bash
git add app/layout.tsx
git commit -m "feat: wire up Sonner toaster and bilingual page metadata"
```

---

## Task 20: Admin page

**Files:**
- Create: `lib/useAdminQuestions.ts`
- Create: `app/admin/[token]/page.tsx`
- Test: `lib/useAdminQuestions.test.ts`
- Test: `app/admin/[token]/page.test.tsx`

**Interfaces:**
- Consumes: `Question`/`QuestionStatus` from `lib/types.ts`, `copy` from `lib/copy.ts`.
- Produces: `useAdminQuestions(token, tab): { questions: Question[]; state: 'loading'|'ready'|'error'; act: (id, status) => Promise<boolean> }`.

- [ ] **Step 1: Write the failing tests for `lib/useAdminQuestions.ts`**

```ts
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAdminQuestions } from './useAdminQuestions'

beforeEach(() => {
  vi.restoreAllMocks()
})

describe('useAdminQuestions', () => {
  it('loads questions for the given tab', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ questions: [{ id: '1', content: 'Q', status: 'pending', likeCount: 0, createdAt: 'now' }] }),
    }) as never

    const { result } = renderHook(() => useAdminQuestions('secret-token', 'pending'))
    await waitFor(() => expect(result.current.state).toBe('ready'))
    expect(result.current.questions).toHaveLength(1)
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/secret-token/questions?status=pending')
  })

  it('act() removes the question from the local list on success', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ questions: [{ id: '1', content: 'Q', status: 'pending', likeCount: 0, createdAt: 'now' }] }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ question: { id: '1', content: 'Q', status: 'approved', likeCount: 0, createdAt: 'now' } }) })

    const { result } = renderHook(() => useAdminQuestions('secret-token', 'pending'))
    await waitFor(() => expect(result.current.questions).toHaveLength(1))

    let success = false
    await act(async () => {
      success = await result.current.act('1', 'approved')
    })

    expect(success).toBe(true)
    expect(result.current.questions).toHaveLength(0)
  })

  it('act() keeps the question in the list and returns false on failure', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ questions: [{ id: '1', content: 'Q', status: 'pending', likeCount: 0, createdAt: 'now' }] }) })
      .mockResolvedValueOnce({ ok: false, json: async () => ({ error: 'not_found' }) })

    const { result } = renderHook(() => useAdminQuestions('secret-token', 'pending'))
    await waitFor(() => expect(result.current.questions).toHaveLength(1))

    let success = true
    await act(async () => {
      success = await result.current.act('1', 'approved')
    })

    expect(success).toBe(false)
    expect(result.current.questions).toHaveLength(1)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run lib/useAdminQuestions.test.ts`
Expected: FAIL — `Cannot find module './useAdminQuestions'`

- [ ] **Step 3: Write `lib/useAdminQuestions.ts`**

```ts
import { useCallback, useEffect, useState } from 'react'
import type { Question, QuestionStatus } from './types'

const POLL_INTERVAL_MS = 4000

export function useAdminQuestions(token: string, tab: 'pending' | 'approved') {
  const [questions, setQuestions] = useState<Question[]>([])
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')

  const load = useCallback(async () => {
    try {
      const response = await fetch(`/api/admin/${token}/questions?status=${tab}`)
      if (!response.ok) throw new Error('load_failed')
      const body = await response.json()
      setQuestions(body.questions)
      setState('ready')
    } catch {
      setState('error')
    }
  }, [token, tab])

  useEffect(() => {
    load()
    const timer = setInterval(load, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [load])

  const act = useCallback(
    async (id: string, status: QuestionStatus): Promise<boolean> => {
      try {
        const response = await fetch(`/api/admin/${token}/questions/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        })
        if (!response.ok) return false
        setQuestions((prev) => prev.filter((q) => q.id !== id))
        return true
      } catch {
        return false
      }
    },
    [token]
  )

  return { questions, state, act }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run lib/useAdminQuestions.test.ts`
Expected: PASS

- [ ] **Step 5: Write the failing tests for the Admin page**

```tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AdminPage from './page'
import * as adminHook from '@/lib/useAdminQuestions'

vi.mock('@/lib/useAdminQuestions')

describe('AdminPage', () => {
  it('shows the pending tab by default with approve/reject buttons', () => {
    vi.spyOn(adminHook, 'useAdminQuestions').mockReturnValue({
      questions: [{ id: '1', content: 'Q1', status: 'pending', likeCount: 0, createdAt: 'now' }],
      state: 'ready',
      act: vi.fn(),
    })

    render(<AdminPage params={Promise.resolve({ token: 'secret-token' })} />)

    expect(screen.getByText('Q1')).toBeInTheDocument()
    expect(screen.getByText('Duyệt / Approve')).toBeInTheDocument()
    expect(screen.getByText('Không duyệt / Reject')).toBeInTheDocument()
  })

  it('shows the pending-empty message when there are no pending questions', () => {
    vi.spyOn(adminHook, 'useAdminQuestions').mockReturnValue({ questions: [], state: 'ready', act: vi.fn() })

    render(<AdminPage params={Promise.resolve({ token: 'secret-token' })} />)

    expect(screen.getByText('Không có câu hỏi mới / No new questions')).toBeInTheDocument()
  })

  it('switches to the approved tab and shows "mark as answered"', () => {
    vi.spyOn(adminHook, 'useAdminQuestions').mockReturnValue({
      questions: [{ id: '1', content: 'Q1', status: 'approved', likeCount: 5, createdAt: 'now' }],
      state: 'ready',
      act: vi.fn(),
    })

    render(<AdminPage params={Promise.resolve({ token: 'secret-token' })} />)
    fireEvent.click(screen.getByText('Đã duyệt / Approved'))

    expect(screen.getByText('Đánh dấu đã trả lời / Mark as answered')).toBeInTheDocument()
  })

  it('calls act with "approved" when Approve is clicked', () => {
    const act = vi.fn().mockResolvedValue(true)
    vi.spyOn(adminHook, 'useAdminQuestions').mockReturnValue({
      questions: [{ id: '1', content: 'Q1', status: 'pending', likeCount: 0, createdAt: 'now' }],
      state: 'ready',
      act,
    })

    render(<AdminPage params={Promise.resolve({ token: 'secret-token' })} />)
    fireEvent.click(screen.getByText('Duyệt / Approve'))

    expect(act).toHaveBeenCalledWith('1', 'approved')
  })
})
```

- [ ] **Step 6: Run tests to verify they fail**

Run: `npx vitest run "app/admin/\[token\]/page.test.tsx"`
Expected: FAIL — `Cannot find module './page'`

- [ ] **Step 7: Write `app/admin/[token]/page.tsx`**

```tsx
'use client'

import { use, useState } from 'react'
import { toast } from 'sonner'
import { useAdminQuestions } from '@/lib/useAdminQuestions'
import { StateMessage } from '@/components/StateMessage'
import { copy } from '@/lib/copy'

export default function AdminPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params)
  const [tab, setTab] = useState<'pending' | 'approved'>('pending')
  const { questions, state, act } = useAdminQuestions(token, tab)

  async function handleAct(id: string, status: 'approved' | 'rejected' | 'answered') {
    const success = await act(id, status)
    if (!success) {
      toast.error(copy.admin.actionFailure)
    }
  }

  return (
    <main className="mx-auto max-w-2xl p-4">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setTab('pending')}
            className={tab === 'pending' ? 'font-bold' : ''}
          >
            {copy.admin.pendingTab}
          </button>
          <button
            type="button"
            onClick={() => setTab('approved')}
            className={tab === 'approved' ? 'font-bold' : ''}
          >
            {copy.admin.approvedTab}
          </button>
        </div>
        <a href={`/api/admin/${token}/export`}>
          <button type="button" className="rounded-lg border border-neutral-300 px-3 py-1">
            {copy.admin.exportButton}
          </button>
        </a>
      </div>

      {state === 'loading' ? (
        <StateMessage kind="loading" text={copy.shared.loading} />
      ) : questions.length === 0 ? (
        <StateMessage kind="empty" text={tab === 'pending' ? copy.admin.pendingEmpty : copy.admin.approvedEmpty} />
      ) : (
        <div className="flex flex-col gap-3">
          {questions.map((question) => (
            <div key={question.id} className="rounded-lg border border-neutral-200 p-4">
              <p>{question.content}</p>
              {tab === 'approved' && <p className="text-xs text-neutral-400">❤️ {question.likeCount}</p>}
              <div className="mt-2 flex gap-2">
                {tab === 'pending' ? (
                  <>
                    <button type="button" onClick={() => handleAct(question.id, 'approved')}>
                      {copy.admin.approve}
                    </button>
                    <button type="button" onClick={() => handleAct(question.id, 'rejected')}>
                      {copy.admin.reject}
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => handleAct(question.id, 'answered')}>
                    {copy.admin.markAnswered}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
```

- [ ] **Step 8: Run tests to verify they pass**

Run: `npx vitest run "app/admin/\[token\]/page.test.tsx"`
Expected: PASS

- [ ] **Step 9: Commit**

```bash
git add lib/useAdminQuestions.ts lib/useAdminQuestions.test.ts "app/admin/[token]"
git commit -m "feat: add Admin screen with pending/approved tabs, moderation actions, and export"
```

---

## Task 21: Apply VNGGames ON brand styling from Figma

**Files:**
- Modify: `app/globals.css`
- Modify: `tailwind.config.ts`

**Interfaces:**
- Consumes: real node data from the Figma file `https://www.figma.com/design/KprMCUGsAJYHAl5Dpd81ov/GamesOn` via the Figma MCP tool.

This task has no automated test — it is a manual visual-fidelity task per the standing project rule that every visual element must be verified against real Figma node data.

- [ ] **Step 1: Fetch the brand tokens from Figma**

Use the Figma MCP tools (`get_variable_defs` and `get_design_context`) against the file `KprMCUGsAJYHAl5Dpd81ov` to pull the real color palette, font family/weights, and spacing scale used on the VNGGames ON landing page. Do not approximate — fetch and record the exact values (hex codes, font names, font weights).

- [ ] **Step 2: Define the tokens as CSS variables**

In `app/globals.css`, add a `:root` block defining CSS custom properties for every color and font fetched in Step 1, e.g. `--color-brand-primary: #<real-hex-from-figma>;`. Import the real font (via `next/font` if it's a Google Font, or `@font-face` if it's a custom upload) instead of the default Next.js font.

- [ ] **Step 3: Wire the tokens into Tailwind**

In `tailwind.config.ts`, extend `theme.colors` and `theme.fontFamily` to reference the CSS variables defined in Step 2, so all three pages (`display`, `employee`, `admin`) can use Tailwind classes (e.g. `bg-brand-primary`) instead of hard-coded hex values.

- [ ] **Step 4: Re-skin the three pages**

Update `app/display/page.tsx`, `app/employee/page.tsx`, `app/admin/[token]/page.tsx`, `components/QuestionCard.tsx`, and `components/StateMessage.tsx` to use the new brand Tailwind classes in place of the generic `neutral-*`/`black` placeholders used in earlier tasks.

- [ ] **Step 5: Run the full test suite to confirm no test relied on the placeholder classes**

Run: `npm test`
Expected: PASS (all tests from Tasks 1–20 still green — tests assert on text/roles/behavior, not CSS classes)

- [ ] **Step 6: Verify visually**

Run: `npm run dev`, open `/display`, `/employee`, and `/admin/<ADMIN_SECRET_TOKEN from .env>` in the browser, and confirm colors/fonts match the Figma file side-by-side.

- [ ] **Step 7: Commit**

```bash
git add app/globals.css tailwind.config.ts app/display/page.tsx app/employee/page.tsx "app/admin/[token]/page.tsx" components/QuestionCard.tsx components/StateMessage.tsx
git commit -m "style: apply real VNGGames ON brand colors and fonts from Figma"
```

---

## Task 22: Deployment

**Files:**
- Create: `README.md`

No automated test — this is a documentation + manual setup task.

- [ ] **Step 1: Write `README.md`** covering, in plain language: what the app is, the 3 URLs (`/display`, `/employee`, `/admin/<token>`), and the required environment variables (`DATABASE_URL`, `ADMIN_SECRET_TOKEN`).

- [ ] **Step 2: Guide the user to create a free Postgres database** (Neon or Supabase), copy its connection string.

- [ ] **Step 3: Guide the user to generate a long random `ADMIN_SECRET_TOKEN`**

```bash
node -e "console.log(require('node:crypto').randomBytes(24).toString('hex'))"
```

- [ ] **Step 4: Apply `schema.sql` to the new database** using the database provider's SQL console (paste the contents of `schema.sql` and run it).

- [ ] **Step 5: Push the branch and open the repo on Vercel**

Explain to the user: connecting the GitHub repo `https://github.com/dattran1551/Voting-poll-app` to Vercel, setting the two environment variables in the Vercel project settings, and deploying. Push requires the user's own GitHub login on this machine — walk them through `git push -u origin docs/spec-audience-qa` (or the working branch at that time) once their GitHub credentials are set up, then merging to `main` via a pull request per the project's branch rule.

- [ ] **Step 6: Smoke-test the live deployment**

Open the live `/display` URL, scan the QR with a phone to reach `/employee`, submit a test question, approve it from `/admin/<token>`, confirm it appears on `/display`, like it, mark it answered, and export the Excel file — following the rehearsal checklist in the spec (§11).

- [ ] **Step 7: Commit**

```bash
git add README.md
git commit -m "docs: add deployment guide"
```

---

## Post-plan reminder

Before the 07/10/2026 event: run the full rehearsal from the spec (§11) with real phones, at least once, a day or two ahead of time.
