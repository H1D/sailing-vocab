# ⚓ Sailing Vocab — RU→EN Trainer (PWA)

An offline-first vocabulary trainer for a Russian-native skipper producing
**British** sailing English under pressure. Built to run on a yacht with **no
internet**: after the first load everything (including the full vocabulary and
manoeuvre sequences) is served from the service-worker precache — zero network
required.

**Boat context:** Marée Haute Django 9.80 — lifting keel, bowsprit + asymmetric
spinnaker/gennaker, tiller, Yanmar 20 hp saildrive diesel. Crew is British, so
British terms are primary and US variants are `aka`.

## Views

- **Search** — browse/search all terms by category; each shows its pronunciation
  respelling (`pron`) and, when expanded, a real on-deck `example`.
- **Cards** — Leitner spaced-repetition flashcards. The card back shows the
  pronunciation respelling (the reliable teacher), the definition, the Russian
  meaning, and an example line. A 🔊 button appears only when a usable English
  voice is available offline.
- **Drill** — multiple-choice quiz over the command terms; reveals the
  pronunciation with the answer.
- **Sheet** — printable cheat sheet: manoeuvre **call → response** sequences
  (tack, gybe, MOB, leaving berth, anchoring, mooring buoy, reefing) plus a flat
  command/winch/mooring reference.

## Pronunciation vs. TTS

The `pron` respelling (Russian-friendly, stressed syllable capitalised) is the
**primary teacher** and always renders. Text-to-speech is a **best-effort
enhancement only** — iOS/Android frequently ship with no offline en-GB (or any
English) voice. The app detects whether an English voice actually loaded and
only then shows the 🔊 button and autoplays on reveal. It never blocks a reveal
and never throws if speech is unavailable.

## Development

```bash
bun install --frozen-lockfile
bun run dev         # dev server
bun run lint        # oxlint
bun run typecheck   # tsc -b
bun run build       # tsc -b && vite build  → dist/
bun run check       # data-contract validation (scripts/check-vocab.ts)
bun run preview     # serve the production dist/ locally
```

## Offline verification

The offline guarantee is verified two ways.

### Static (automated in this build)

After `bun run build`:

- `dist/sw.js` and `dist/workbox-*.js` are emitted.
- The precache manifest inside `dist/sw.js` lists `index.html` and the main
  `assets/index-*.js` chunk.
- The vocabulary is **inlined into the JS chunk** (grep `dist/assets/*.js` for a
  known term such as `halyard` or `mainsheet` — both are present). The app
  contains **no `fetch`/XHR of vocab.json**, so no network call is needed for
  data after first load.

### Manual offline test (do this on-device before the trip)

No headless browser (Playwright/Puppeteer) is installed in CI, so the live
offline check is manual. Steps:

1. `bun run build && bun run preview` — note the localhost URL it prints
   (e.g. `http://localhost:4173`).
2. Open that URL in Chrome. Open DevTools → **Application → Service Workers** and
   confirm a service worker is **activated and running** (reload once if it is
   still "installing"). Under **Application → Cache Storage** confirm a
   `workbox-precache-*` cache exists containing `index.html` and the
   `assets/index-*.js` chunk.
3. In DevTools go to the **Network** tab and tick **Offline** (or toggle the OS
   network off entirely).
4. **Reload the page.** It must load fully from cache.
5. Verify all four views work offline:
   - **Search**: type a query, results appear; expand a term — `pron` and
     `example` render.
   - **Cards**: tap **Reveal** — the pronunciation, definition, Russian, and any
     example render. (🔊 may be absent if no English voice — that is expected.)
   - **Drill**: answer a question; the correct answer highlights and the
     pronunciation shows.
   - **Sheet**: the manoeuvre call→response sequences and the command reference
     render.
6. Install to the home screen (Add to Home Screen) and repeat step 3–5 launched
   from the icon, fully offline, to confirm the standalone PWA works with no
   network.
