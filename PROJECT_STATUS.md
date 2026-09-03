# Tan Clan Exhibition — Project Status / Handoff

Last updated: 2026-09-03. Written because the previous chat session hit its
context limit — read this first in a new session to get back up to speed
without re-deriving everything.

## What this project is

A kiosk web app for the Tan Clan Exhibition: a visitor first completes a
short DREAMS 2026 / OOY CIRCLE feedback survey, then a child builds a
4-generation family tree (great-grandparents → grandparents → parents →
self + siblings) on an exhibition laptop, watches an animated map of the
family's migration to Singapore, and prints a postcard-sized keepsake. A QR
code lets the family continue at home (add real photos, fill in gaps) and
submit for a competition. Staff can review all submissions and print any of
them via a local-only admin tool.

**Hard requirements that shaped every decision below:**
- Fully offline, no build step — kiosk runs by just double-clicking
  `index.html` (`file://`), no local server.
- No CDN dependencies for the offline parts. The two features that
  genuinely need the internet (cloud sync, take-home editor) are the *only*
  places external scripts are loaded, and that's called out explicitly in
  code comments.

## Current architecture

```
index.html          Kiosk: language pick → DREAMS 2026 survey → family chart
                     → migration map reveal → preview → print / share
print.html           Prints the family tree postcard (A6/4x6"/A5)
print-map.html       Prints the migration map postcard
edit/                Take-home editor — deployed publicly to GitHub Pages
admin/               Staff-only submissions list + print — LOCAL ONLY,
                     gitignored, never pushed to GitHub (see below)
js/                  Shared logic (see "Key files" below)
css/style.css        Shared styles for the kiosk + reused by edit/ and admin/
```

**Cloud backend:** Firebase project `tan-clan-exhibition` (Spark/free plan,
deliberately — no billing, no Cloud Functions, no Cloud Storage). Firestore
holds one document per visitor in a `submissions` collection. Photos are
stored as compressed base64 JPEGs directly in the document (not Cloud
Storage — that needs the paid Blaze plan, which we avoided).

**Hosting:** the take-home editor (`edit/`) is deployed via **GitHub Pages**
(not Firebase Hosting — Firebase Hosting deploy was blocked by the
`empirecode.edu.sg` Google Workspace org's security policies; GitHub is a
separate platform those policies don't touch). Live at:
`https://empireaidev.github.io/tan-clan-exhibition/`

Repo: `https://github.com/EmpireAIDev/tan-clan-exhibition` — **must stay
public**. GitHub Pages on a free personal account only serves from public
repos; it went offline once already when the repo was briefly made private.

## What's built and verified working end-to-end

1. **DREAMS 2026 / OOY CIRCLE survey** (`js/survey.js` + `js/survey-questions.js`,
   the `survey` screen) — runs once, **before** the family chart, and must be
   completed to proceed (blocks on the PDPA consent checkbox; also requires
   Mobile or Email, but only if "Join OOY CIRCLE" or "Keep me informed" was
   checked). English-only for now (matching `edit/app.js`'s existing
   precedent). 5 sections exactly per the brief: exhibition feedback,
   future-programme interest, About You, "Continue the Journey" opt-ins
   (join / keep informed / contribute, with a conditional reveal), and the
   PDPA notice + consent. Ends on a `survey-thanks` interstitial ("THANK
   YOU... OOY CIRCLE") with a "Continue to your family tree" button that
   resets `history` to skip back over survey/survey-thanks, so the chart's
   Back button can never trigger a second submission. Answers live in
   `State.data.survey` but are **deliberately excluded from Firestore** —
   `js/sync.js`'s `createShareLink` destructures `survey` out of the payload
   before writing, so this data never leaves the visitor's laptop.
2. **Local CSV logging** (`js/csv-log.js`) — every survey submission appends
   a row (client-side, via `CsvLog.logSubmission`) to a plain array in
   `localStorage` (`tanclan_survey_rows`). Staff export the accumulated CSV
   any time via an **Export CSV** button — present in both the kiosk's ⚙
   Settings modal and the admin portal (both read the same localStorage,
   since they're `file://` pages under the same folder) — which triggers a
   normal browser download; staff save it into `Documents\Academic`
   themselves. **This is a deliberate, considered design, not a shortcut:**
   Chrome's File System Access API (`showDirectoryPicker`, which would allow
   true live-append into one open file with zero staff action) requires a
   secure context, and `file://` is not one — confirmed empirically
   (`window.isSecureContext` is `false`, `showDirectoryPicker` is
   `undefined` on this app's kiosk pages). Introducing a local server just to
   unlock that API would break the "double-click index.html, no install"
   requirement, so manual export was chosen instead. See `SURVEY_CSV_COLUMNS`
   in `js/survey-questions.js` for the exact column order (20 columns,
   matching the brief's "Database Requirements" list 1:1).
3. **Family chart QnA** (`js/chart-editor.js`, latest revamp) — two-panel
   layout on the `chart` screen: **left** (`js/flow.js`'s `renderChartLeft`)
   is a live read-only preview using `tree.js`'s `renderFamilyTree`, always
   visible while filling the form. **Right** (`renderQuestionPanel` in
   `js/chart-editor.js`) is a scrollable list of question cards — one per
   person, phrased as a question ("What's your dad's name?"), each with a
   tappable avatar for **Take Photo** (webcam) / **Upload** / **Remove**,
   name, job, and (for siblings) older/younger + brother/sister type.
   Per-generation "Where did they live?" questions set migration-map data.
   **+ Add sibling** / **×** manage up to 6 siblings. A generation counts as
   "known" purely by whether its name fields got filled in (no separate
   yes/no toggle) — `renderChartLeft` derives `knowGrandparents` /
   `knowGreatGrandparents` on every keystroke so the left tree grows live.
   Required: self, father, mother names. Typing in the right panel never
   re-renders the right panel itself (only the left tree), so there's no
   focus/cursor loss while typing; only structural changes (add/remove
   sibling) re-render both.
4. **Migration map** (`js/migration-map.js`) — custom stylized SVG map
   (China → Hong Kong/Taiwan → Southeast Asia → Singapore), animates
   pin-by-pin through whichever generations have an origin set, "Watch
   again" button, printable.
5. **Printing** (`print.html`, `print-map.html`) — both scale-to-fit at
   3 paper sizes (A6 postcard / 4×6" photo / A5), staff-selectable via the
   ⚙ settings modal. Real uploaded photos render instead of the
   initial-letter placeholder when present.
6. **Cloud sync + QR** (`js/sync.js`, button on the preview screen) —
   generates a Firestore doc ID client-side (works even fully offline,
   syncs once connectivity returns via Firestore's offline persistence),
   shows a QR code (`js/qrcode-lib.js`, vendored locally) + short link to
   `edit/`.
7. **Take-home editor** (`edit/`) — loads a submission by ID from the URL
   (`?id=...`), lets the family fix names/jobs, upload real photos, and
   submit for the competition. Also the *only* place the 5 fixed
   **intergenerational dialogue questions** (`js/dialogue-questions.js`,
   e.g. "What was Grandpa's first job? → Ask Grandma") are shown and
   answered — deliberately never surfaced during the kiosk chart step.
   Answers save into `data.dialogueAnswers[id]` on the same debounced
   auto-save as everything else, and follow `data.lang` (en/zh) even
   though the rest of this page's copy is English-only. Live on GitHub
   Pages.
8. **Admin portal** (`admin/`, **local-only, gitignored**) — silently
   signs in with one Firebase Auth account (no visible login form), lists
   every submission (Firestore `list` is otherwise blocked by security
   rules — this is the one identity allowed to bypass that), click into
   any submission to preview and print it (family tree and/or migration
   map) using the same tested print pipeline. Detail view also shows a
   read-only "Family Stories" readout of any answered dialogue questions.
   Also has its own **Export CSV** button (same local survey data as the
   kiosk's Settings modal).

## Key files

| File | Purpose |
|---|---|
| `js/state.js` | Central data model (`State.data`) + localStorage persistence + `PAPER_SIZES` |
| `js/tree.js` | Read-only tree renderer + SVG connector lines — reused everywhere (preview, print, edit, admin) |
| `js/chart-editor.js` | Right-panel question editor for the kiosk chart step — left-panel live preview lives in `js/flow.js`'s `renderChartLeft` |
| `js/dialogue-questions.js` | The 5 fixed intergenerational dialogue questions (en/zh) — used by `edit/app.js` and `admin/main.js`, never by the kiosk |
| `js/photo-capture.js` | Shared image compress/resize helper + webcam capture modal — used by kiosk chart and `edit/app.js` |
| `js/migration-map.js` | Migration map SVG + animation, shared by on-screen reveal and print |
| `js/places.js` | Preset city list for migration origins |
| `js/flow.js` | Kiosk screen navigation, validation, idle auto-reset (3 min) |
| `js/sync.js` | Firestore write + share-link/QR generation (Firebase **compat** SDK) |
| `js/firebase-config.js` | Public Firebase project config (see note below — this is *not* a secret) |
| `js/i18n.js` | English/简体中文 dictionary |
| `js/survey.js` | DREAMS 2026 survey screen (render/validate/buildCsvRow) — English-only |
| `js/survey-questions.js` | Survey option lists, PDPA notice text, `SURVEY_CSV_COLUMNS` |
| `js/csv-log.js` | Local-only survey row storage + CSV download — never touches Firestore |
| `edit/app.js` | Take-home editor logic |
| `admin/main.js` | Admin portal logic — **contains the admin Firebase Auth password, gitignored** |

## Important gotchas learned this session (don't redo this debugging)

- **`<script type="module">` breaks over `file://`** — Chrome blocks it
  with a CORS error. This is why `js/sync.js` and `edit/app.js` use
  Firebase's **compat** (namespaced, `firebase.auth()`/`firebase.firestore()`)
  build via plain `<script>` tags, not the modular ES-module SDK.
- **Filenames like `app.js` and `share.js` get silently blocked by
  ad-blocker filter lists** (`ERR_BLOCKED_BY_CLIENT`, no visible error).
  That's why the kiosk's flow logic is `js/flow.js` (not `app.js`), the
  share step is `js/takehome.js`, and the admin logic is `admin/main.js`
  (not `admin/app.js` — that one bit us mid-session too).
- **The Firebase `apiKey` in `js/firebase-config.js` is not a secret.**
  Making the GitHub repo private over this concern broke GitHub Pages and
  didn't actually hide anything (the key is still visible in the deployed
  page's source regardless). Firestore **Security Rules** are the real
  access boundary, not the key.
- **Firebase App Check was evaluated and rejected** — it requires a real
  registered domain (reCAPTCHA), which conflicts with the kiosk running
  over `file://` with no domain at all. Used lightweight write-validation
  in the Firestore rules instead (free, `file://`-compatible).
- **This dev sandbox's Browser-pane tool has caching quirks** unrelated to
  the app: stale cached JS/CSS in reused tabs (fix: open a genuinely new
  tab, or in the worst case cache-bust with `?v=2`), and `location.href`
  navigation / query strings sometimes not reflecting in the tool's own
  tracking even though the underlying page is correct. When something
  looks broken, verify via `fetch()` or direct DOM/state inspection before
  concluding it's a real bug — several apparent bugs this session turned
  out to be purely this tool's artifacts.
- **This project's folder is outside the Browser-pane tool's own "project
  folder," so `file://` pages here sometimes render as a frozen `data:`
  URL snapshot instead of a live page** — `location.protocol` reads
  `data:`, `isSecureContext` is `false`, external `<script src>`/`fetch()`
  to sibling files silently fail (opaque origin), and `localStorage` throws
  outright ("Storage is disabled inside 'data:' URLs"). This is *separate*
  from the caching quirk above and from real file:// behavior — a real
  double-clicked `index.html` in actual Chrome does not have this problem
  (localStorage/fetch/`isSecureContext` all behave normally there; verified
  throughout this project via State.save()/print.html round-trips). When a
  test tab shows `data:` instead of `file:`, retry with a genuinely new tab
  a few times; if it won't cooperate, paste each file's real source
  directly into `javascript_exec`'s `text` and `eval` it in-page (bypasses
  `fetch` entirely) rather than trusting `<script src>` to have loaded.
- **This is also why the File System Access API
  (`showDirectoryPicker`) can't be used for the DREAMS 2026 survey's CSV
  logging** — it requires a secure context, `file://` isn't one (confirmed
  via `window.isSecureContext === false` on a real, non-snapshot kiosk
  page, not just the sandbox), and this app deliberately has no server. See
  "Local CSV logging" above for the manual-export approach used instead.
- **GitHub Pages CDN has propagation lag** after a push (tens of seconds) —
  don't conclude a deploy failed until you've waited and retried.

## Accounts / credentials reference (not reproduced here for safety)

- **Firebase project:** `tan-clan-exhibition`, Spark (free) plan, owned by
  `dev@empirecode.edu.sg` (Google Workspace, org has strict security
  policies — CLI login and service-account-key creation are both blocked
  by org policy; browser-console access works fine).
- **Firebase Auth admin account:** created for the admin portal; its
  email/password live in `admin/main.js` (gitignored — check that file
  locally, don't recreate the account).
- **GitHub account:** `EmpireAIDev`, already authenticated in this
  environment's Browser pane and via Git Credential Manager locally (git
  push works without re-auth).

## Known open items / not yet done

- **The PDPA notice in the survey (`js/survey-questions.js`'s
  `PDPA_NOTICE_PARAGRAPHS`) has a literal placeholder** —
  `[INSERT PEK SEK TAN CLAN ASSOCIATION DPO / PRIVACY CONTACT EMAIL]` —
  and per the brief must be reviewed/finalised by the Association's
  DPO/privacy officer before this goes live at a real event. Don't fill
  this in with an invented email.
- **The survey (`js/survey.js`) is English-only**, matching `edit/app.js`'s
  existing precedent — it does not switch with the kiosk's EN/中文 toggle.
  Worth revisiting if a real event needs it bilingual, especially since the
  intergenerational angle of this whole project suggests older/Chinese-
  reading relatives are a real audience.
- **CSV export is manual, not live-appending**, by explicit user decision —
  see "Local CSV logging" above and the gotchas section for why (File
  System Access API needs a secure context; `file://` isn't one). Staff
  need to remember to click **Export CSV** periodically (kiosk ⚙ Settings
  or the admin portal) and save the download into `Documents\Academic`
  themselves — nothing does this automatically.
- **Webcam capture needs a real on-site hardware test.** Verified working
  correctly in code (calls `getUserMedia` properly, degrades gracefully to
  an "try Upload instead" message on failure) but this dev sandbox has no
  camera, so it's untested against real exhibition-laptop hardware/camera
  permission prompts.
- **The "sample chart" the user mentioned early on was never actually
  shared.** Current field set (name, relation, occupation, photo per
  person) is an assumption — worth double-checking against the real
  sample if it surfaces.
- **`Tan Clan 3.rar`** sits untracked in the project folder (not in git,
  not investigated) — probably a user backup, left alone.
- No automated test suite — all verification this session was manual
  browser testing (documented inline in commit messages).

## Suggested first steps in a new session

1. Skim this file, then check `git log --oneline` in the project folder
   for the full commit history/detail behind each change.
2. If continuing UI/feature work: open `index.html` locally to confirm
   current state still works before making changes.
3. If picking up the webcam hardware test: just needs a real laptop with
   a camera, no code changes anticipated unless something breaks.
