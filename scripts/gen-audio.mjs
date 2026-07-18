#!/usr/bin/env node
// Generate offline pronunciation audio for every term/example/drill line via ElevenLabs.
// Voice: George (British storyteller) steered into a gruff old sea captain with v3 audio tags.
// Resumable: skips any clip already present (>2KB). Concurrency-limited with retry/backoff.
//
//   ELEVENLABS_API_KEY=... node scripts/gen-audio.mjs [--limit N]
//
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = join(__dir, '..')
const AUDIO = join(ROOT, 'public', 'audio')
const KEY = process.env.ELEVENLABS_API_KEY
if (!KEY) { console.error('no ELEVENLABS_API_KEY'); process.exit(1) }

const VOICE = 'JBFqnCBsd6RMkjVDRZzb' // George
const API = 'https://api.elevenlabs.io/v1'
const FMT = 'mp3_44100_128'
const CONCURRENCY = 3
const LIMIT = (() => { const i = process.argv.indexOf('--limit'); return i > -1 ? Number(process.argv[i + 1]) : Infinity })()

const data = JSON.parse(readFileSync(join(ROOT, 'src', 'data', 'vocab.json'), 'utf8'))

// pause instead of an em-dash so v3 doesn't read the dash
const clean = (s) => s.replace(/\s*—\s*/g, '... ').replace(/\s+/g, ' ').trim()

// Build the worklist. Each item -> one mp3.
const items = []
for (const t of data.terms) {
  items.push({
    kind: 'terms', id: t.id, model: 'eleven_v3', stability: 0.5,
    text: `[gruff, weathered old sea captain] ${clean(t.term)}`,
  })
  if (t.example) items.push({
    kind: 'examples', id: t.id, model: 'eleven_v3', stability: 0.4,
    text: `[gruff, weathered, teaching] ${clean(t.example)}`,
  })
}
for (const seq of data.sequences) {
  seq.steps.forEach((step, i) => {
    const bark = step.by === 'helm' ? 'barking over the wind' : 'crew shouting back'
    items.push({
      kind: 'drills', id: `${seq.id}-${i}`, model: 'eleven_v3', stability: 0.4,
      text: `[${bark}, gruff] ${clean(step.call)}`,
    })
  })
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function ttsOne(item) {
  const out = join(AUDIO, item.kind, `${item.id}.mp3`)
  mkdirSync(dirname(out), { recursive: true })
  if (existsSync(out) && statSync(out).size > 2048) return { ...item, out, skipped: true }
  const body = JSON.stringify({
    text: item.text, model_id: item.model,
    voice_settings: { stability: item.stability, similarity_boost: 0.85, style: 0.3, use_speaker_boost: true },
  })
  for (let attempt = 1; attempt <= 4; attempt++) {
    let res
    try {
      res = await fetch(`${API}/text-to-speech/${VOICE}?output_format=${FMT}`, {
        method: 'POST',
        headers: { 'xi-api-key': KEY, 'Content-Type': 'application/json' },
        body,
      })
    } catch { await sleep(1500 * attempt); continue }
    if (res.status === 200) {
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length < 512) { await sleep(1200 * attempt); continue }
      writeFileSync(out, buf)
      return { ...item, out, bytes: buf.length }
    }
    if (res.status === 429 || res.status >= 500) { await sleep(2000 * attempt); continue }
    const msg = await res.text().catch(() => '')
    return { ...item, out, error: `http ${res.status} ${msg.slice(0, 160)}` }
  }
  return { ...item, out, error: 'exhausted retries' }
}

// simple concurrency pool
async function run() {
  const work = items.slice(0, LIMIT)
  console.log(`worklist: ${work.length} clips (terms/examples/drills), concurrency ${CONCURRENCY}`)
  let idx = 0, done = 0, made = 0, skipped = 0
  const errors = []
  const manifest = {}
  async function worker() {
    while (idx < work.length) {
      const item = work[idx++]
      const r = await ttsOne(item)
      done++
      if (r.error) errors.push(`${r.kind}/${r.id}: ${r.error}`)
      else {
        manifest[`${r.kind}/${r.id}`] = `audio/${r.kind}/${r.id}.mp3`
        if (r.skipped) skipped++; else made++
      }
      if (done % 20 === 0 || done === work.length)
        console.log(`  ${done}/${work.length}  made=${made} skipped=${skipped} err=${errors.length}`)
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker))
  writeFileSync(join(AUDIO, 'manifest.json'), JSON.stringify(manifest, null, 0))
  console.log(`\nDONE made=${made} skipped=${skipped} errors=${errors.length}`)
  if (errors.length) { console.log('ERRORS:'); errors.slice(0, 40).forEach((e) => console.log('  ' + e)) }
}
run()
