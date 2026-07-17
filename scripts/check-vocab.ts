#!/usr/bin/env bun
/**
 * Data-contract validator for the RU→EN sailing vocabulary trainer.
 *
 *   bun scripts/check-vocab.ts      (aliased as `bun run check`)
 *
 * Hard failures (exit 1) block CI so the dataset can never drift from the type
 * contract in src/types/index.ts. Softer issues are printed as warnings and do
 * not fail the build.
 */
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { CATEGORIES, type CommandRole } from '../src/types/index.ts'

const ROLES: readonly CommandRole[] = ['helm', 'crew', 'both']
const here = dirname(fileURLToPath(import.meta.url))
const dataPath = join(here, '..', 'src', 'data', 'vocab.json')

const raw = JSON.parse(readFileSync(dataPath, 'utf8')) as {
  meta?: { version?: number; total_terms?: number }
  terms?: Array<Record<string, unknown>>
  sequences?: Array<Record<string, unknown>>
}

const terms = raw.terms ?? []
const sequences = raw.sequences ?? []
const errors: string[] = []
const warnings: string[] = []
const err = (m: string) => errors.push(m)
const warn = (m: string) => warnings.push(m)

const catSet = new Set<string>(CATEGORIES)
const usedCats = new Set<string>()
const ids = new Set<string>()

// ---- terms ----
terms.forEach((t, i) => {
  const id = t.id as string
  const where = `terms[${i}] (${id ?? '?'})`
  if (!id || typeof id !== 'string') {
    err(`${where}: missing/invalid id`)
  } else {
    if (ids.has(id)) err(`${where}: duplicate id "${id}"`)
    ids.add(id)
    if (!/^[a-z0-9-]+$/.test(id)) warn(`${where}: id is not kebab-case`)
  }

  for (const f of ['term', 'ru', 'definition'] as const) {
    const v = t[f]
    if (typeof v !== 'string' || !v.trim()) err(`${where}: missing/empty "${f}"`)
  }

  const cat = t.category as string
  if (!catSet.has(cat)) err(`${where}: category "${cat}" not in CATEGORIES`)
  else usedCats.add(cat)

  // Definition of done #1 — pron on EVERY term.
  if (typeof t.pron !== 'string' || !t.pron.trim())
    err(`${where}: missing "pron" (required on every term)`)

  // Definition of done #2 — example on every command.
  if (cat === 'commands' && (typeof t.example !== 'string' || !t.example.trim()))
    err(`${where}: command is missing "example"`)

  // role only on commands, and must be a valid value.
  if (t.role !== undefined) {
    if (cat !== 'commands') err(`${where}: "role" is only allowed on commands`)
    if (!ROLES.includes(t.role as CommandRole)) err(`${where}: invalid role "${String(t.role)}"`)
  }

  // Soft: keep definitions short.
  const def = typeof t.definition === 'string' ? t.definition : ''
  if ((def.match(/[.!?](\s|$)/g) ?? []).length > 2) warn(`${where}: definition is > 2 sentences`)
})

if (raw.meta?.total_terms !== undefined && raw.meta.total_terms !== terms.length)
  err(`meta.total_terms (${raw.meta.total_terms}) !== terms.length (${terms.length})`)

// Declared-but-unused categories are a warning (CI stays green if, say, an
// aspirational category ends up empty) rather than a hard failure.
for (const c of CATEGORIES) if (!usedCats.has(c)) warn(`category "${c}" is declared but unused`)

// ---- sequences (call-and-response manoeuvres) ----
const seqIds = new Set<string>()
sequences.forEach((s, i) => {
  const id = s.id as string
  const where = `sequences[${i}] (${id ?? '?'})`
  if (!id) err(`${where}: missing id`)
  else {
    if (seqIds.has(id)) err(`${where}: duplicate id "${id}"`)
    seqIds.add(id)
  }
  for (const f of ['name', 'ru'] as const) {
    const v = s[f]
    if (typeof v !== 'string' || !v.trim()) err(`${where}: missing "${f}"`)
  }
  const steps = s.steps as Array<Record<string, unknown>> | undefined
  if (!Array.isArray(steps) || steps.length === 0) {
    err(`${where}: needs at least one step`)
  } else {
    steps.forEach((st, j) => {
      const sw = `${where}.steps[${j}]`
      for (const f of ['call', 'ru'] as const) {
        const v = st[f]
        if (typeof v !== 'string' || !v.trim()) err(`${sw}: missing "${f}"`)
      }
      if (!ROLES.includes(st.by as CommandRole)) err(`${sw}: invalid "by" (${String(st.by)})`)
    })
  }
})

// ---- report ----
if (warnings.length) {
  console.log(`\n⚠️  ${warnings.length} warning(s):`)
  for (const w of warnings) console.log('   • ' + w)
}
if (errors.length) {
  console.error(`\n❌ check-vocab FAILED — ${errors.length} error(s):`)
  for (const e of errors) console.error('   • ' + e)
  process.exit(1)
}
console.log(
  `\n✅ check-vocab passed: ${terms.length} terms, ${sequences.length} sequences, ` +
    `${usedCats.size}/${CATEGORIES.length} categories in use.`,
)
