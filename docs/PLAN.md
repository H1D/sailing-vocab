# Sailing Vocab Trainer — Finish & Harden Plan (v3)

> **v3 consolidates two parallel session attempts** and folds in a broader safety-content scope.
> It supersedes v2 but keeps all of v2's verified fixes. Two *fresh* independent reviews are run
> against **this** document before implementation (see §10); their resolutions land in §11.

## 0. Consolidation decision (why this repo)
Two interrupted sessions produced two repos:
- **`H1D/sailing-vocab`** (this one) — a *working* Vite+React 19+TS+Tailwind+PWA app: 177 terms /
  10 categories, Browse + Train (Leitner SRS) + Drill + CheatSheet + PointsOfSail, `useLeitner`/
  `useNightMode`/`useTTS`. Real content, real UI. Debt: red deploy-only CI, no PR, dup root data,
  dead `src/types/term.ts`, RU errors, boilerplate README.
- **`H1D/sail-vocab`** — a nicer *scaffold* (shadcn, wouter, swipe gestures) but **zero content**
  (empty `vocab.json`, stub pages) and a more *ambitious content plan* (≈18 categories incl. VHF
  depth, tender/kill-cord, tide/pilotage, domestic systems).

**Decision:** finish on **`sailing-vocab`** (real code + content beats a bare scaffold), and fold
the sibling's *content breadth* and its best UX idea (one-handed swipe on cards) into this plan.
`sail-vocab` is parked, not deleted (no destructive action without Artem's OK).

## 1. Context
Artem skippers/sails in **Russian**. He is about to cruise a **Marée Haute Django 9.80** (9.8 m
cruising **sloop**: mainsail + genoa/jib on furler, optional asymmetric **gennaker**, **lifting
keel**, inboard diesel) with **English-speaking friends**. He knows the *concepts* cold; he needs
to instantly **produce** the English words and the **real spoken commands** for every phase of
sailing — **offline, one-handed, on a moving boat**.

**Success:** on deck, Artem is never caught mute at a critical moment — tacking, gybing, coming
alongside, picking up a mooring, anchoring, reefing, MOB, engine, VHF, right-of-way.

## 2. Current state (baseline on `main`)
Builds clean from the working tree. 177 terms / 10 categories. Views wired via hash nav. **But:**
CI red (deploy-only, needs missing CF secrets); no PR; unused root `sailing-vocab.json` duplicates
`src/data/vocab.json` (currently byte-identical — just delete the root copy); dead
`src/types/term.ts` (a different, unused schema); boilerplate README; **Train shows English on the
front (recognition), which is the wrong direction**; several **verified RU errors** (see §5A).

## 3. Definition of Done
1. Accurate RU→EN vocab in **British/RYA** register; real spoken commands verified by an SME.
2. **Broadened safety coverage** — the sibling plan's must-haves that are genuinely absent are
   added (§5A), without bloating into a dictionary.
3. **Single source of truth** for data + an automated data-integrity check.
4. **Green, correctness-gating CI**: install → lint → build (`tsc -b` typechecks) → data-check, on
   `pull_request` **and** `push`, with `concurrency` cancel.
5. Deploy workflow that **cannot go red from missing secrets** and never auto-deploys prod.
6. Train trains **production** (RU→EN, hidden answer → reveal, TTS self-check).
7. Real README; dead code removed; correct `<title>`/`lang`/meta.
8. All work on a branch → **PR** → CI green.

## 4. Data contract (shared, non-breaking — LOCKED before fan-out)
Keep the schema in **`src/types/index.ts`** (the real one). Add only **optional** fields:
```ts
Term {
  id, term /*EN*/, ru, definition, category,
  aka?, role?,           // role only on 'commands'
  trainable?,            // false = reference-only (Browse/CheatSheet), excluded from Train/Drill
  pron?,                 // NEW optional: pronunciation hint tuned to a RU speaker's traps
  example?               // NEW optional: one short real on-deck usage line
}
```
- `pron?` — RU-speaker traps only: gunwale "GUN-nel", leeward "LOO-ard", bowline "BOH-lin",
  boatswain "BOH-sun", halyard "HAL-yard", gybe "guy-b". Not generic IPA, not on "hull".
- `example?` — e.g. "Ease the mainsheet!". Spend effort on dangerous words + commands only.
- `meta.total_terms` MUST equal `terms.length`. `category` MUST stay within the `Category` union.
- **Adding a new category = a coordinated change**: A adds terms, B renders it, the union in
  `types/index.ts` gains the string. Because `types/index.ts` is owned by B, **A must SendMessage
  B the exact new category ids** so B extends the union + any category label/order maps. No new
  category ships unless it appears in the union (data-check enforces `category ∈ enum`).
- Render `pron`/`example` **only when present**; empty ones never block the PR.

## 5. Workstreams — parallel, **disjoint file ownership**

### A. Content & correctness — *owns `src/data/vocab.json` ONLY* (highest value)
**Fix the verified errors (v2, re-confirmed):**
- `in-irons`: drop "в штиль" (=becalmed) → "встать носом к ветру, потеряв ход".
- `chop`: drop "кильватерная зыбь" (=wake) → "толчея / короткая крутая волна".
- `headsail`: definition must NOT include spinnaker (a spinnaker is not a headsail).
- `head-of-sail`: drop "фал" (=halyard) from `ru`.
- `luff`: drop "лата" (=batten) from `ru`.
- `kicker`: drop "гик-шкот" (=mainsheet) → "оттяжка гика / ванг".
- `cmd-back-the-jib`: `ru` → "Обстени стаксель! / Заложи стаксель на ветер!".
- `life-jacket`: do NOT list "buoyancy aid" as a synonym — split into its own term (a lifejacket
  self-rights an unconscious casualty; a buoyancy aid does not — safety distinction).
- `no-go-zone`: drop aka "the eye of the wind" (that's the exact wind direction, not the arc).
- Promote **"Lee-oh!"** as the primary British helm call (trigger "Ready about!").

**Add the verified-absent must-haves** (correct `role` on every command):
- **Coming-alongside / berthing:** `Fenders out!/Fenders in!`, `Rig the lines`, `Stand by the
  bow/stern line`, `Take up the slack`, `Ready to slip`, `Slip the lines`, `Make fast`; **Med-moor:**
  `Back her in`, `Pick up the lazy line`, `Step ashore, don't jump`.
- **Reefing (spoken):** `Ready to reef!`, `Drop to the first reef`, `Ease the halyard`, `Tension
  the reef line`, `Shake out the reef`.
- **MOB crew actions:** `Man overboard!`, `Keep pointing at him!` (spotter), `Hit the MOB button`.
- **Engine / manoeuvring:** `Start the engine`, `Ahead/Astern/Neutral`, `In gear`, `Tick over`,
  `Kill the engine`.
- **Boat-specific (promised, currently MISSING):** `lifting keel`, `Raise/Lower the keel`,
  `gennaker/asymmetric`, `Furl/Unfurl the genoa`.
- **VHF working phrases (split routine vs distress):** `Radio check`, `Say again`, `How do you read
  me?`, `Standing by on one-six`, `Sécurité`, `Switch to channel …` (Mayday/Pan-Pan already there).
- **Right-of-way & collision hails:** `Starboard!`, `Water!`/`Room to tack!`, `Give way!`,
  `Stand on!`, repeated `Ease, ease, ease`.
- **Anchoring (spoken):** `Let go the anchor!`, `Snub it / Make fast the rode`, `Weigh anchor`,
  `She's dragging!`.
- **Depth / grounding (top incident on a lifting-keel boat in tidal water):** `What's the depth?`,
  `We're touching / We've run aground`.
- **Helm hand-off:** `You have the helm / I have the helm`, `Hold your course / Steady as she goes`.
- **Hazard-in-water hail:** `Lobster pot on the bow`, `Hazard, one o'clock`.

**⟳ v3 breadth folded in from the sibling plan (add only what's genuinely useful, no dictionary
bloat):**
- **Tender & dinghy** (charter reality): `tender/RIB`, `outboard`, **`kill cord`** (safety),
  `painter`, `oars`, `rowlocks`, `bung`, "step into the middle".
- **Tide & pilotage** (Django has a lifting keel — tidal awareness is safety): `springs/neaps`,
  `tidal gate`, `tidal stream`, `transit / leading line`, "tide with/against us", "clearance under
  the keel".
- **Domestic / systems** (living aboard with the crew): `heads` (+ "the heads are blocked"),
  `seacock`, `gas — on/off at the bottle`, `shore power`, `holding tank`, `bilge`.
- **Watch & lookout:** "keep a good lookout", watch handover, "be sick to leeward".
- **Winch chatter:** "Take a wrap", "Tail for me", "Made fast", "Let it fly!" (complements existing
  winch-work).

**Grouping:** the content author decides final category ids, but every new id **must** be sent to
B for the union (see §4). Suggested new ids: `engine`, `vhf` (or fold VHF into `safety`/`commands`),
`tender`, `tide`, `domestic`. Keep total tasteful — target **~230–270 terms**, not 400.

**Authenticity rule (SME):** write the EN as the exact words a British skipper *shouts on deck*,
then render natural Russian command register — never word-for-word. Prefer the short working call
(`Lee-oh!`, `All fast!`, `Let go forrard!`) over the textbook sentence. Deck commands are
imperatives + boat-part names. **RU false-friend notes are mandatory** on: `руль`→rudder (blade) vs
helm/wheel/tiller (control); `поворот`→**tack vs gybe** (safety!); `шкот`→sheet vs line vs halyard
("rope" almost never used aboard); `приём`→"over"; `как слышите`→"how do you read me?"; left/right
vs port/starboard helm orders; fender (UK) vs US "bumper". Do NOT encode expected crew replies into
the JSON (that's the parked call-and-response tool). Keep `meta.total_terms` in sync. **No new npm
deps.**

### B. Frontend & UX — *owns `src/**` except `src/data/`; also `index.html`, `README.md`; deletes root `sailing-vocab.json`; must NOT touch `package.json` or `.github/`*
- Delete unused root `sailing-vocab.json`; delete dead `src/types/term.ts`.
- Extend the `Category` union in `src/types/index.ts` with the new ids A sends (via SendMessage);
  add any category label/order map so new categories render in Browse/CheatSheet.
- **Flip Train to RU→EN production**: prompt the **Russian**, keep the English hidden until reveal
  ("say it, then flip"), keep TTS to self-check pronunciation. (Currently it shows `term` (EN) on
  the front — recognition, the wrong way.)
- **⟳ One-handed swipe on Train cards** (best idea from the sibling scaffold): swipe/right-tap =
  "got it", swipe/left-tap = "again". Implement with **pointer/touch events — NO new dependency**
  (`@use-gesture` is NOT allowed here; hand-rolled threshold on `pointerdown/up` is fine). Large
  tap targets remain; buttons stay as a fallback. Must not break Leitner semantics.
- Render `pron`/`example` when present.
- Real README (what / why / run / build / deploy). `index.html`: correct `<title>`, `lang="en"`,
  description meta, theme-color.
- Keep mobile ergonomics: 44px targets, night mode, safe-area insets. **No dev-meta / badges /
  architecture text anywhere in the UI.**

### C. CI / DevOps — *owns `.github/**`, `package.json` scripts, `scripts/`; must NOT add deps*
- New `.github/workflows/ci.yml`: `oven-sh/setup-bun@v2` pinned `bun-version: "1.x"` →
  `bun install --frozen-lockfile` → `bun run lint` → `bun run build` (runs `tsc -b`, so it
  typechecks) → `bun run check:data`. Triggers on `pull_request` **and** `push`. Add `concurrency`
  to cancel superseded runs.
- **Data-integrity check** = plain `scripts/check-vocab.ts` run via `bun run check:data` (NOT
  vitest — no new deps). Assert: every term has id/term/ru/definition/category; ids unique;
  `category ∈ enum` (**import the enum/union list from a single shared source so it never drifts
  from `types/index.ts`** — e.g. a `CATEGORIES` const array the type derives from, or a literal
  list kept in the script with a comment pointing at the type); `meta.total_terms === terms.length`;
  every `commands` term has a `role`; no empty `ru`/`term`/`definition`. `process.exit(1)` on
  failure, print a clear pass/fail summary.
- **MUST add to `package.json`:** `"check:data": "bun run scripts/check-vocab.ts"`.
- **JSON load in the script:** `JSON.parse(readFileSync(new URL('../src/data/vocab.json',
  import.meta.url),'utf-8'))` — cwd-independent, avoids import-assertion / `verbatimModuleSyntax`
  friction. Do NOT use a bare JSON `import`.
- **Do NOT add `scripts/` to any tsconfig `include`** (it runs via `bun run`; adding it to the
  project graph breaks `bun run build`).
- Rewrite `deploy.yml`: trigger `workflow_dispatch` **only**; guard the deploy step with
  `if: ${{ env.CLOUDFLARE_API_TOKEN != '' }}` (secrets via `env:`, valid at step level). Never
  auto-deploy on push. (Job-level `if` on `secrets.*` is invalid — do NOT use it.)
- No dep changes → no `bun.lock` edit; keep it valid for `--frozen-lockfile`.

## 6. Coordination (subagents may talk)
All three share §4. **A→B SendMessage** is required for any new `category` id (union + render).
A↔C may confirm the enforced field list. File ownership is disjoint → parallel-safe in one tree.
If the enum/union needs a shared const (C's data-check + B's union), B owns `types/index.ts` and
exports the canonical `CATEGORIES` list; C imports intent from it (or mirrors with a pointer
comment). Resolve any overlap by message, not by editing another agent's files.

## 7. Sequencing
1. Branch `feat/finish-trainer` off `main`. ✅ (done)
2. Run A / B / C in parallel; A pushes category ids to B early.
3. Integrate locally: `bun install` → `bun run lint` → `bun run build` → `bun run check:data`; fix
   breakage; smoke-run `bun run preview`.
4. Commit, push, open **PR**.
5. Two *implementation* review personas review the diff → fix worthy items, push back on nits.
6. CI green → done. Deploy only if Artem explicitly asks (`workflow_dispatch`).

## 8. Non-goals
- No backend, login, accounts, PII. Progress stays in `localStorage`.
- Not building the call-and-response pair engine now (**flagged as the highest-value next step**:
  helm call → expected crew reply for the ~10 core manoeuvres).
- No UI meta-text/badges. **No new npm dependencies** (swipe is hand-rolled).
- Not translating word-for-word; not a full nautical dictionary.

## 9. Risks & mitigations
- **RU accuracy is safety-critical** → SME-written, false-friend notes mandatory, data-check + human
  review gate. Wrong `поворот`→tack/gybe could cause a crash-gybe injury.
- **Category union drift** (A adds id, B/type/enum forget) → single `CATEGORIES` source + data-check
  `category ∈ enum` fails CI loudly.
- **Swipe breaks Leitner or scrolling** → hand-rolled threshold, buttons remain, test on touch.
- **CI red from secrets** → deploy is `workflow_dispatch` + step-level env guard; CI job never
  references secrets.
- **Scope creep in content** → cap ~230–270 terms; breadth items are a checklist, not open-ended.

## 10. Plan review (v3) — two fresh independent reviewers
Run **before** implementation, against this document:
- **Reviewer 1 — RYA Yachtmaster / working charter skipper (RU+EN):** is the *content scope* right
  and safe? Missing must-haves? Any register/false-friend error in §5A? Is anything added that a
  real crew never says? Does the RU→EN "production" framing match how commands are actually given?
- **Reviewer 2 — principal frontend/PWA + DevOps engineer:** will the CI actually go green on a
  fresh checkout (bun/tsc/oxlint/JSON-load pitfalls)? Is the deploy guard valid YAML/Actions
  semantics? Is the swipe-without-deps + Leitner interaction sound? Any file-ownership collision
  that breaks parallel work? Is the data-check enum-drift mitigation real?

## 11. Review resolutions (v3)
_(to be filled after §10 — fixes adopted vs pushed back, with reasons)_
