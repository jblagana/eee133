# EEE 133 · Circuits and Electronics II — Practice Hub

A practice companion for **EEE 133 (Circuits and Electronics II)**.
Each chapter includes a bank of conceptual questions and circuit problems
with step-by-step worked solutions and circuit diagrams.

## Chapters

| # | Title | Conceptual | Problems |
|---|-------|-----------|----------|
| 02 | Capacitors and Inductors | 30 | 30 |
| 03 | First-Order Circuits · Part 1 | 30 | 30 |
| 04 | First-Order Circuits · Part 2 | 30 | 30 |
| 05 | Linear Waveshaping | 30 | 30 |
| 06 | Second-Order Circuits · Natural Response | 30 | 30 |
| 07 | Second-Order Circuits · Complete Response | 30 | 30 |

## Structure

```
├── index.html              ← Practice hub (home)
├── practice-02.html        ← Chapter 02 practice
├── practice-03.html        ← Chapter 03 practice
├── practice-04.html        ← Chapter 04 practice
├── practice-05.html        ← Chapter 05 practice
├── practice-06.html        ← Chapter 06 practice
├── practice-07.html        ← Chapter 07 practice
├── data/                   ← Question bank JSON (source data)
├── css/style.css           ← Shared design system
├── archive/lessons/        ← Original interactive lecture pages
└── js/                     ← (legacy, used by archived lessons)
```

## Tech

- Zero-build static site (GitHub Pages)
- MathJax 3 for LaTeX rendering
- Inline SVG circuit diagrams (circuitikz-style)
- No external JS dependencies beyond MathJax CDN
