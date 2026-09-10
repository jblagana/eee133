# EEE 133 · Circuits and Electronics II — Interactive Lecture Companion

Interactive companion site for the EEE 133 (Circuits and Electronics II) lecture decks,
Lectures 2–6.

Each lecture page mirrors the slide flow: concept → theory → worked example →
hands-on lab → self-test. Every equation is rendered live with MathJax, the
labs are pure canvas simulations (no dependencies to build), and reading
progress, quiz scores and completion state are saved in `localStorage`.
Lectures 02–06 also embed **live circuit simulators** — animated schematics
driven by a built-in MNA solver (backward-Euler), with sliders, switches,
current-flow animation, voltage/current probes and a rolling oscilloscope —
so each topic can be explored with a pre-wired circuit before the lab.

## Lectures

| # | Page | Content | Labs |
|---|------|---------|------|
| 02 | `02-capacitors-inductors.html` | V–I relations, power, stored energy, series/parallel reduction | 5 |
| 03 | `03-first-order-part1.html` | DE origins, natural vs forced response, τ, source-free RL & RC | 3 |
| 04 | `04-first-order-part2.html` | 4-step procedure, Thévenin R, unit step, pulsed excitation | 3 |
| 05 | `05-linear-waveshaping.html` | HP/LP waveshaping, 3-dB cutoff, tilt, differentiator/integrator | 2 |
| 06 | `06-second-order-circuits.html` | Natural response, characteristic equation, α/ω₀, the three damping regimes, ringing, six-step procedure | 3 |

The original slide PDFs are intentionally **not included in this repository** —
the site is self-contained (all content, formulas, examples and quizzes are
re-created interactively in the pages themselves).

## Live circuit simulators

14 pre-wired, topic-matched simulators (one engine, `js/circsim.js`) are
embedded in the lecture flow. Each sim solves the circuit in real time with
a modified-nodal-analysis solver (backward-Euler time stepping), animates
current flow on the wires, and shows live probes/readouts; sims with a
`scope` block also render a rolling oscilloscope. Simulations pause
automatically when scrolled off-screen.

| Lecture | Simulators |
|---------|-----------|
| 02 | capacitor charging (RC step), capacitor in a DC circuit (blocks DC), series/parallel capacitor combination, inductor charging, series/parallel inductor combination |
| 03 | source-free RC, source-free RL, RL step response |
| 04 | Thévenin τ (voltage-divider source + Rth), pulsed excitation with scope |
| 05 | RC waveshaper (scope), 3-dB cutoff — steady-state magnitude sweep (analytic phase mode) |
| 06 | undriven LC tank (energy conservation), series RLC — underdamped/critical/overdamped presets |

Toggling a topology (e.g. series ↔ parallel) or a switch resets nothing:
element state is keyed by branch id, so stored energy is preserved across
rebuilds, exactly as in a real circuit where the energy storage elements
are never removed.

## Structure

```
index.html                  Dashboard (progress, formula reference)
02-….html … 06-….html       Lecture pages (MathJax via CDN)
css/style.css               Shared theme (light/dark), layout, labs, quizzes
js/plot.js                  window.Plot — tiny canvas plotter (series, fill, dash,
                            points, vLines/hLines, regions, legend)
js/circsim.js               window.CircSim — live circuit simulator engine (MNA
                            solver, animated schematic renderer, oscilloscope,
                            control/readout UI); mounted from each lecture script
js/common.js                window.E133 — theme, TOC scrollspy, reading depth,
                            quizzes, flashcards, mark-complete, dashboard refresh
js/lecture0X.js             Per-lecture labs (IIFE, guarded, registered via
                            window.E133.onRedraw)
```

## Development

Zero-build static site — just open `index.html` in a browser, or serve locally:

```sh
python3 -m http.server 8000
# → http://localhost:8000
```

### Lab unit convention

The RC labs in Lecture 05 use an arbitrary *τ-scale*: the R and C sliders are
dimensionless scales (Ω-scale, µF-scale) and τ = R·C is reported in a.u. —
the shapes of the responses only depend on t/τ, so the physics is exact.
Lectures 03–04 labs use concrete SI values (kΩ, µF, H → τ in ms/s).

## Deploying to GitHub Pages

```sh
git init                          # already done in this folder
git add -A
git commit -m "EEE 133 interactive lecture companion (Lectures 2–6)"

# create the remote (e.g. via https://github.com/new or the gh CLI), then:
git remote add origin git@github.com:<USER>/eee133.git
git branch -M main
git push -u origin main
```

Then in the repo settings: **Settings → Pages → Build and deployment →
Source: "Deploy from a branch" → Branch: `main`, / (root) → Save.**
The site goes live at `https://<USER>.github.io/eee133/`.

The site deploys automatically on every push to `main` — in repo
**Settings → Pages** the source is **Deploy from a branch** (`main`, root).
No build step is needed: everything is plain static files.
