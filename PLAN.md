# PLAN v3 — Sailing English Trainer (RU→EN) — Finish & Harden

*(v2 = round-1 review by Capt. Ellison (RYA/ESL) + Dieter Voss (FE/PWA/CI). v3 = round-2 review by Capt. S. Whitcombe (RYA Yachtmaster, mixed crews) + Priya Nair (offline-PWA/DX). Both round-2 verdicts: GO-WITH-CHANGES.)*

## v3 deltas (round-2 review, folded in)
**Content / on-the-water (Whitcombe):**
- **Data accuracy fixes (safety):** `in-irons.ru` drop "в штиль" (becalmed ≠ head-to-wind); `close-reach.ru` drop "острый бакштаг" (a close reach is *forward* of the beam, not a backstay angle) → e.g. «курс чуть полнее бейдевинда, ветер впереди траверза»; `kill-switch` — the Django is an **inboard Yanmar**, describe an **engine stop button/cable**, not a lanyard/«шнур безопасности».
- **Add high-frequency commands the plan missed:** `Starboard!` (right-of-way hail — the single most-shouted safety word), `Harden up!` (pair with existing `Bear away!`), `Water!/No water`, `Helm's amidships`, furl-under-load (`Furl the genoa/Roll away the headsail`), buoy pick-up (`On the buoy/Slip the mooring`), `motor-sailing`, `keel up/drop the keel` **as commands**.
- **MOB procedure words become real `commands` with examples** ("Stop the boat!", "Keep pointing at them!", "Hit the MOB button!") — not noun-only wishlist.
- **Sequences:** encode a canonical single tack call-and-response ("Ready about?"→"Ready!"→"Lee-oh!"); remove overlapping stray "Tacking!"/"Helms alee!" duplicate command terms; add **reefing** and **gybe** and **MOB** and **leaving-berth** and **anchoring/buoy** sequences (README promises "reef in a blow" → it must be drillable).
- Keep the **sheet/"shit", heads, tack, port** confusable note (tiny, prevents real embarrassment); **defer** full phonetic alphabet, inshore-forecast, holding-tank as follow-up.

**Offline / PWA / CI (Nair):**
- **Respelling `pron` always renders; TTS is best-effort enhancement** (iOS/Android often have no en-GB voice offline). `useTTS` must handle empty `getVoices()`/`onvoiceschanged` and expose whether an en-GB voice actually loaded; UI degrades honestly. *(This inverts v2's "TTS is the primary teacher".)*
- **`maximumFileSizeToCacheInBytes` set explicitly** in `vite.config.ts` so no chunk is silently dropped from the offline precache. **[done]**
- **Explicit offline gate**: build, serve `dist/`, load, go offline, reload → all 4 views + a Train session work. Not assumed from config.
- **`CATEGORY_LABELS` for every rendered category** (engine/vhf/tide/domestic); assign a few `tender`/dinghy terms so no declared category is empty (else `check-vocab` warns).
- Confirmed correct in v2 (no change): `deploy.yml` job-level `if: secrets.CLOUDFLARE_API_TOKEN != ''` guard skips=neutral (no red X); `scripts/**/*.ts` already in `tsconfig.node.json`; `meta.total_terms===terms.length` already holds; frozen-lockfile + pinned `bun 1.3.9` make the bleeding-edge deps safe. **Cut:** `test:` alias facade, `definition ≤ 2 sentences` as a *warning* not hard-fail, command-chain drill mode (follow-up).

**Contract frozen + tooling done by orchestrator before fan-out:** `Term`/`CATEGORIES` unchanged; added `ManoeuvreSequence`/`SequenceStep` + `VocabData.sequences`; wrote `scripts/check-vocab.ts` (pron-on-all, example-on-commands, role-only-on-commands, sequence structure); added `typecheck`/`check` scripts; wrote `ci.yml`; guarded `deploy.yml`; deleted `src/types/term.ts`, `docs/PLAN.md`, root `sailing-vocab.json`.

---
*(Original v2 body follows.)*

## 1. Context
Consolidating crashed-session work onto **`sailing-vocab`** (repo `H1D/sailing-vocab`, branch `feat/finish-trainer`).
Stack: React 19 + Vite 8 + Tailwind 3 + vite-plugin-pwa. Build passes today (`tsc -b && vite build`).

Exists & works: 177-term dataset (`src/data/vocab.json`, schema `src/types/index.ts::Term`), 10 categories in use, views Browse/Train/Drill/CheatSheet, hooks useLeitner (SRS)/useTTS/useNightMode, PointsOfSail diagram.

**User:** Artem — Russian-native skipper; knows sailing in RU, must *produce* English words/commands under pressure. Crew is **British** → British terms primary, US as `aka`.
**Boat:** **Marée Haute Django 9.80** — monohull, **lifting keel** (draught 1.10/2.40 m), **bowsprit + asymmetric spinnaker/gennaker**, **tiller**, **Yanmar 20 hp saildrive diesel** (→ prop walk), 2 cabins.

## 2. Definition of done
1. **`pron` on all terms** — Russian-friendly respelling, stressed syllable capitalised. Prioritise words NOT said as spelled; **verify each against a dictionary** (see §4A for the corrected reference set).
2. **`example` on every `commands` term** and every safety-critical term (real on-deck line).
3. Coverage gaps from review **closed** (engine/manoeuvring, mooring call-and-response, MOB procedure words, VHF, domestic/galley) — see §4A must-add list.
4. Orphaned categories **used**: re-file into `engine`, `vhf`, `tide`, `domestic` (already in `CATEGORIES`); views render them.
5. **~10 Django-specific terms** added (lifting keel + "keel up/down", bowsprit, asymmetric/gennaker + tack line + snuffer, tiller extension, sprayhood, guardrail(=lifeline), gooseneck, saildrive).
6. **Views render `pron` + `example`** (Train card back, Drill, CheatSheet) — this is explicit UI work, not free.
7. **CI green on PR without secrets**: bun install --frozen-lockfile → lint → **`tsc -b --noEmit`** → build → `bun scripts/check-vocab.ts`.
8. `scripts/check-vocab.ts` enforces the data contract incl. **pron-on-all** and **example-on-all-commands**.
9. Dead code removed (`src/types/term.ts`); root `sailing-vocab.json` mirror **deleted**; single source of truth = `src/data/vocab.json` + `src/types/index.ts`.
10. `deploy.yml` guarded so it can't show a red X on `main` without CF secrets.

## 3. Non-goals
- No prod deploy in this PR (deploy stays main-only + secret-guarded, NOT part of green-CI gate).
- No backend/accounts/analytics. No framework rebuild. Don't touch `sail-vocab` / `sailing-english-trainer` repos.
- **No vitest** this PR (check-vocab covers the real failure mode = data drift). Optional single `bun test` for Leitner box math is a follow-up, not a blocker.

## 4. Workstreams

### A. Data enrichment & safety fixes *(content — Data agent)*
**Safety/accuracy fixes first (treat as safety work):**
- `in-irons.ru`: remove "штиль" (that's *becalmed*). → `«привестись к ветру и потерять ход / зависнуть носом к ветру»`.
- Manoeuvre calls → British RYA form: primary **"Lee-oh!"** (aka "Helms alee!"), **"Gybe-oh!"** (fix "Gybe ho!" spelling), pattern `"Ready about?" → "Ready!" → "Lee-oh!"`.
- `life-jacket.aka`: **remove "buoyancy aid"** (different kit; keep PFD).
- `fender.aka += "bumper"`; `pontoon.aka += "dock finger"`; guardrail↔lifeline = one object (aka), not two terms.

**`pron` on all 177 + new terms.** Corrected reference respellings (verify each): buoy «БОЙ» (BrE), gunwale «ГАН-л», leeward «ЛУ-ард», windward «УИНД-ард», halyard «ХЭЛ-ярд», boatswain «БОУ-сн», forecastle «ФОУК-сл», gybe «ДЖАЙБ», quay «КИ», clew «КЛУ», luff «ЛАФ», bilge «БИЛДЖ», warp «УОРП», sheet «ШИИТ» (долгое и — не "шит").

**Must-add terms/phrases (EN — RU), with pron + example:**
- *Engine/manoeuvring (was ZERO):* ahead «вперёд», astern «задний ход», neutral «нейтраль», tick over/idle «на холостых», slow/half/full ahead, "give her some revs" «прибавь оборотов», prop walk «увод кормы», "no steerage / she's not responding" «нет хода / руль не слушается».
- *Mooring call-and-response:* "fenders down/rig the fenders" «вывесить кранцы», "lines ready" «швартовы готовы», "ashore!" «на берег!», "take the slack / hold her there" «выбери слабину», "let go forward/aft" «отдай носовой/кормовой», "made fast fwd/aft" «закреплён», snub «задержать конец», windlass «якорная лебёдка», "veer/pay out chain" «потравить цепь», scope «длина цепи», "she's bringing up / dug in" «якорь забрал», lazy line/slime line «му́ринг».
- *Winch safety:* riding/overriding turn «закус на лебёдке», "off the winch!" «убери руку с лебёдки».
- *MOB procedure words:* "Stop the boat!", "Keep pointing at them!" «не своди глаз», "Hit the MOB button!", recovery «подъём на борт». Complete the triad: **Securité** «сигнал безопасности» (Mayday/Pan-Pan already present).
- *VHF:* radio check «проверка связи», marina-call template "«[Marina] Marina, this is yacht [name]…»", say again/figures + phonetic alphabet mini-set (Alpha–Zulu) as reference terms.
- *Weather:* inshore-waters forecast, visibility/fog «видимость/туман».
- *Domestic/galley (was empty):* galley «камбуз», saloon «кают-компания», berth/bunk «койка», chart table «штурманский стол», **seacock «кингстон»** (safety), heads «гальюн», water tank/fresh water, gas bottle, stove/hob, holding tank.
- *Confusable homographs* — add `disambiguation`-style note in `definition` or `aka`: sheet vs "shit", tack (verb/corner/line), head(s) (bow/toilet/sail-corner), port (side/harbour).

**Re-file categories:** move VHF/AIS/ch16 → `vhf`; throttle/engine/kill-switch/impeller/alarm → `engine`; tide/current → `tide`; galley/saloon/berth/seacock/heads/water/gas → `domestic`. Keep `meta.total_terms == terms.length`.

**Manoeuvre sequences (for chain drill / cheat-sheet):** encode call-and-response order for Tack, Gybe, MOB, Leaving berth, Anchoring (data-driven so C can render).

### B. Tooling / CI *(Engineer agent — do FIRST so A can use it as a live guardrail)*
- `scripts/check-vocab.ts` (run via `bun`): unique `id`; `category ∈ CATEGORIES` (import const); non-empty `term`/`ru`/`definition`; `definition` ≤ 2 sentences; **`pron` on all**; **`example` on all `commands`**; `role` only on `commands`; `meta.total_terms === terms.length`. Readable report, non-zero exit on any failure.
- Add `scripts/**/*.ts` to `tsconfig.node.json` `include` (so it's typechecked).
- `package.json` scripts: `"typecheck": "tsc -b --noEmit"`, `"check": "bun scripts/check-vocab.ts"`, `"test": "bun run check"`. (Do NOT use bare `tsc --noEmit` — no-op against root config. Do NOT add tsx.)
- `.github/workflows/ci.yml` on `push`+`pull_request`: checkout → setup-bun (**pin `bun-version: 1.3.9`**) → `bun install --frozen-lockfile` → `bun run lint` → `bun run typecheck` → `bun run build` → `bun run check`.
- `deploy.yml`: keep main-only; add job-level `if: ${{ secrets.CLOUDFLARE_API_TOKEN != '' }}` so it skips (not fails) without secrets.
- Delete root `sailing-vocab.json` (gitignored/drifted) and its concept from check-vocab.

### C. Code cleanup + UX rendering *(Engineer agent)*
- Delete `src/types/term.ts`.
- **Render `pron`** on Train card back + Drill answer + CheatSheet rows; **render `example`** on command/safety cards + CheatSheet. Prominent **TTS speaker button (en-GB, autoplay on reveal, graceful fallback)** — TTS is the primary teacher, respelling the fallback.
- Add category labels/icons for the newly-used `engine/vhf/tide/domestic`.
- CheatSheet: group commands as **call → response** using the manoeuvre sequences. (Stretch: a "Command chain" drill mode prompting RU→EN sequences in order — include if clean, else follow-up.)
- Verify (already largely OK per review): distractor gen (no dupes, correct always present, shuffled), Leitner box transitions + nextReview. Mobile tap targets / contrast / night mode.

### D. Docs
- README: trip + boat context, how to use (scenario drilling: "leaving the marina", "MOB", "reef in a blow"), dev/CI commands. Remove stray `docs/PLAN.md`.

## 5. Execution model
1. **Freeze the contract first**: `src/types/index.ts` (`Term` + `CATEGORIES`) + write `check-vocab.ts` (agent B) — one short first step.
2. Then **fan out in parallel** against the frozen contract: Data agent (A) enriches `src/data/vocab.json`, running `bun run check` as its guardrail; Engineer agent (B/C) does CI + rendering + cleanup. They coordinate via the check-vocab contract + a shared note channel; only the Data agent edits `vocab.json`, only the Engineer edits `package.json`/tsconfig/workflows/views (no file collisions).
3. Reconcile → build+lint+typecheck+check all green locally.

## 6. Review gates
- Plan: 2 personas (done, round 1 → v2; round 2 to confirm).
- Code (post-impl): bilingual sailing-English SME + senior TS/React/PWA reviewer. Fix real issues, push back on nits. Then PR `feat/finish-trainer` → `main`, CI green.

## 7. Risks
- Pron subjectivity → consistent scheme, dictionary-verified, TTS is primary. 
- Data/validator drift → single `CATEGORIES` + check-vocab in CI (guardrail during enrichment).
- Bleeding-edge deps (TS6/Vite8/React19) → pinned lockfile + `--frozen-lockfile` + pinned bun in CI.
