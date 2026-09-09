# EEE 133 · Circuit Theory — Interactive Lecture Companion

Interactive companion site for the EEE 133 (Circuit Theory) lecture decks,
UP Diliman · College of Engineering · EEE Institute, 1st Semester A.Y. 2026–2027.

Each lecture page mirrors the slide flow: concept → theory → worked example →
hands-on lab → self-test. Every equation is rendered live with MathJax, the
labs are pure canvas simulations (no dependencies to build), and reading
progress, quiz scores and completion state are saved in `localStorage`.

## Lectures

| # | Page | Content | Labs |
|---|------|---------|------|
| 02 | `02-capacitors-inductors.html` | V–I relations, power, stored energy, series/parallel reduction | 5 |
| 03 | `03-first-order-part1.html` | DE origins, natural vs forced response, τ, source-free RL & RC | 3 |
| 04 | `04-first-order-part2.html` | 4-step procedure, Thévenin R, unit step, pulsed excitation | 3 |
| 05 | `05-linear-waveshaping.html` | HP/LP waveshaping, 3-dB cutoff, tilt, differentiator/integrator | 2 |
| 06 | (PDF only, in `Lectures/`) | Second-order circuits, characteristic roots, damping, step response | — |

The original slide PDFs live in `Lectures/` and are linked from the dashboard.
They are **excluded from the GitHub Pages build** (see `_config.yml`) and the
site links to them through `github.com` blob URLs.
Lecture 06 has no interactive page yet — its dashboard card and the Lecture 05
"next" pointer both link to the PDF deck directly.

## Structure

```
index.html                  Dashboard (progress, PDF downloads, formula reference)
02-….html … 05-….html       Lecture pages (MathJax via CDN)
css/style.css               Shared theme (light/dark), layout, labs, quizzes
js/plot.js                  window.Plot — tiny canvas plotter (series, fill, dash,
                            points, vLines/hLines, regions, legend)
js/common.js                window.E133 — theme, TOC scrollspy, reading depth,
                            quizzes, flashcards, mark-complete, dashboard refresh
js/lecture0X.js             Per-lecture labs (IIFE, guarded, registered via
                            window.E133.onRedraw)
Lectures/*.pdf              Original slide decks (excluded from the Pages
                            build via _config.yml; linked via github.com)
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
git commit -m "EEE 133 interactive lecture companion (Lectures 2–5)"

# create the remote (e.g. via https://github.com/new or the gh CLI), then:
git remote add origin git@github.com:<USER>/eee133.git
git branch -M main
git push -u origin main
```

Then in the repo settings: **Settings → Pages → Build and deployment →
Source: "Deploy from a branch" → Branch: `main`, / (root) → Save.**
The site goes live at `https://<USER>.github.io/eee133/`.

Jekyll runs on the Pages build (no `.nojekyll`), with `_config.yml` excluding
the `Lectures/` folder so the original slide decks are **not** published on the
Pages site. The site's deck links therefore point to the GitHub blob URLs
(`https://github.com/jblagana/eee133/blob/main/Lectures/…pdf`).
