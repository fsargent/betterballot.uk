# Contributing to betterballot.uk

Thanks for wanting to help! This is a public-domain ([CC0](https://creativecommons.org/publicdomain/zero/1.0/))
remix of [Nicky Case's "To Build a Better Ballot"](https://ncase.me/ballot/), reworked for the UK
and extended with **proportional representation**. You can do anything you like with it.

This doc explains how the project is laid out, how the simulation engine works, and how to
make a change without breaking anything.

---

## TL;DR for contributors

- It's a **static site, no build step**. Edit a file, refresh the browser.
- You **must serve it over HTTP** (not `file://`) or the iframes/assets won't load:
  ```
  npx serve .          # then open the printed http://localhost:… URL
  # or:  python3 -m http.server
  ```
- Keep it **dependency-free and ES5-flavoured** to match the existing engine, and keep the
  tone **playful but even-handed** across political parties.
- Everything is public domain. Don't add anything that isn't.

---

## Repository layout

```
index.html            The whole article (scrollytelling page). All prose lives here.
css/index.css         Styles for the article page.
js/index.js           Tiny: just tells the splash iframe when it's on-screen.
favicon.png

play/                 THE SIMULATION ENGINE + the embedded sim pages (iframes)
  js/                   The engine (see "Architecture" below)
  css/                  model.css / election.css / ballot.css / sandbox.css
  img/                  Candidate shapes, voter faces, ballot-paper artwork, icons
  model1-3.html         Intro sims (spoiler effect)
  ballot1-3.html        Single-winner ballot demos (Choose one / Alternative Vote / Choose many)
  election1-2.html      Single-winner comparison + the Alternative Vote glitch
  pr_party.html         Proportional demo: Party List   (locked single method)
  pr_stv.html           Proportional demo: Single Transferable Vote
  pr_choosemany.html    Proportional demo: Proportional Choose Many
  election_pr.html      Proportional playground (switch between all three)

sandbox/              Standalone "Sandbox Mode" wrapper around play/ (all methods)
splash/               The animated header
social/  img/         Share images and article artwork
README.md  LICENSE  CONTRIBUTING.md

voter/                A SEPARATE embedded repo — see "Legacy engine vs voter/" below.
site/                 (empty; leftover from an earlier folder move — safe to delete)
```

Every interactive box in `index.html` is an `<iframe>` pointing at a page in `play/`
(or `sandbox/`). Each of those pages loads the engine scripts and calls a `main(...)`.

---

## Architecture (the legacy engine, `play/js/`)

This is the original Nicky Case engine: **vanilla ES5, no modules, no build.** Scripts are
loaded with plain `<script>` tags in dependency order and communicate through globals.

The core idea is a **spatial model**: candidates and voters are points on a 2D political map.
Each voter "votes" based on which candidates are nearest, and a counting method turns those
ballots into a result.

### The pieces

| File | Role |
|------|------|
| `Model.js` | The world: holds `candidates[]` and `voters[]`, runs the draw/update loop, exposes `getBallots()` and `getTotalVoters()`. |
| `Candidate.js` | A candidate. The five "characters" (square/triangle/hexagon/pentagon/bob) have hand-drawn images; **any other id is a generated coloured circle** (`Candidate.ensure` + `Candidate.extraColors`) so we can run realistic elections with many candidates. |
| `Voters.js` | Voter *types* (`PluralityVoter`, `RankedVoter`, `ApprovalVoter`, `ScoreVoter`) and voter *distributions* (`GaussianVoters` crowd, `SingleVoter`). A voter type's `getBallot(x,y)` produces that voter's ballot from distances to candidates. |
| `Ballot.js` | Draws the little paper-ballot graphic for the single-voter demos. |
| `Election.js` | **One function per counting method.** Each reads `model.getBallots()` and writes a result into `model.caption`. |
| `Buttons.js` | `ButtonGroup` — the grey toggle buttons (pick a system, seats, etc.). |
| `Draggable.js` / `Mouse.js` | Click-and-drag for candidates and voter crowds. |
| `Loader.js` | Pre-loads images, then fires `main()`. |
| `helpers.js` | `Math.TAU`, and `_icon(id)` — renders a candidate's icon (shape image, or a coloured dot for generated candidates). |
| `minpubsub.js` | Tiny pub/sub used for update events. |
| `main_ballot.js` | Wires up the single-voter ballot demos (`ballot1-3.html`). |
| `main_sandbox.js` | Wires up the comparison sims (`election1-2.html`) **and** the full Sandbox. |
| `main_pr.js` | Wires up the proportional sims (`pr_*.html`, `election_pr.html`). |

### Data flow

```
positions (drag) → each voter's getBallot() → model.getBallots()
                 → Election.<method>(model, {seats}) → HTML written to model.caption
```

### Voting methods (`Election.js`)

**Single-winner** (elect one): `plurality` (FPTP / Choose one), `irv` (Alternative Vote),
`approval` (Choose many).

**Proportional / multi-winner** (fill several seats): `partylist` (Party List, Sainte-Laguë),
`stv` (Single Transferable Vote, Droop quota + fractional transfers), `spav`
(Proportional Choose Many / proportional approval, sequential reweighting). These read a
`seats` option and render a coloured **seat row** via `_seatRow`.

The neat parallel the article leans on: each single-winner ballot has a proportional sibling
that uses **the same ballot** — Choose one → Party List, Ranked → STV, Choose many →
Proportional Choose Many.

### Which methods show up where

`main_sandbox.js` only adds the proportional methods (and the "how many seats?" control)
when `config.features >= 4` — i.e. in the **Sandbox**. The in-article comparison sims
(`election1-2.html`, `features: 1`) deliberately stay single-winner-only.

---

## Legacy engine vs `voter/`

There are two distinct codebases in this repo, and it's important not to confuse them:

- **The legacy engine** — everything in `play/js/`. This is the public-domain Nicky-Case-derived
  simulator (ES5, no build) that **currently powers the live site**. All the changes that affect
  what visitors see go here.

- **`voter/`** — a **separate, embedded git repository** (a gitlink/submodule, not registered in
  `.gitmodules`). It's a standalone/modern voting simulator kept alongside this project and is
  **not** wired into `index.html`. It has its own history, its own README, and possibly its own
  build. Treat it as an independent project: change it in its own repo, not from here. It may not
  even be checked out in your working tree (a bare `voter` gitlink with no contents is normal —
  run `git submodule update --init voter` if you actually need it).

If you're improving the interactive article, you almost certainly want the **legacy engine**, not
`voter/`.

---

## How to make common changes

- **Fix wording / examples:** edit `index.html` (prose) — that's the whole article.
- **Tune a voting method:** edit the relevant function in `play/js/Election.js`.
- **Add candidates / change defaults of a sim:** edit the `main({...})` call at the bottom of the
  relevant `play/*.html`, or the defaults in `main_pr.js` / `main_sandbox.js`.
- **Restyle a sim:** `play/css/*.css`. Restyle the article: `css/index.css`.

### Conventions

- ES5 (`var`, function expressions), **tabs** for indentation, match the surrounding style.
- No new runtime dependencies, no bundler. If you can't do it in a `<script>` tag, reconsider.
- Candidate colours for generated candidates come from `Candidate.extraColors` — keep them
  distinct from each other and from the five characters.

---

## Testing your change

There are no automated tests; verify by eye:

1. Serve the site (`npx serve .`) and click through the sims you touched.
2. Quick sanity check that the JS still parses:
   ```
   node --check play/js/Election.js
   ```
3. For a fast headless smoke test, you can render a sim page and check the result text:
   ```
   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
     --headless --disable-gpu --virtual-time-budget=4000 --dump-dom \
     "file://$PWD/play/pr_stv.html" | grep -i "quota\|elected\|seats"
   ```
   (If the caption is empty, your JS threw — open it in a real browser and check the console.)

---

## Tone & accuracy

This is about the *maths* of voting, which is non-partisan. Keep UK examples **even-handed** —
First Past the Post over- and under-rewards different parties in different decades, and the piece
should read that way. Date-stamp anything that will age (election results, the Senedd's 2026
change, etc.).

Thank you, and — as Nicky would say — &lt;3
