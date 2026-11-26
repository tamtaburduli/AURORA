# AURORA — research website

**Adaptive Uncertainty-aware Radiative Observation and Ranging Architecture**
An independent research project by Tamta Burduli.

> Beyond fixed observations. Toward information-aware sensing.

This repository contains the public website for AURORA: a static React + TypeScript site that runs entirely in the browser and deploys to GitHub Pages. It has no backend, no paid APIs, and no secret keys.

AURORA is an ongoing scientific research project, not a commercially available or fully validated physical sensor.

---

## Contents

| Route | Page |
|---|---|
| `#/` | Home: mission, research question, status |
| `#/research` | Research overview: motivating problems |
| `#/architecture` | Interactive ten-stage architecture diagram |
| `#/spectral` | Five-band adaptive spectral explorer (illustrative) |
| `#/multimodal` | Optical, polarimetric, acoustic, microwave, mechanical modules |
| `#/radiative-transfer` | libRadtran/DISORT parameter space and toy inverse problem |
| `#/mathematics` | Mathematical framework (KaTeX) |
| `#/simulator` | Illustrative fixed / random / adaptive simulator |
| `#/results` | Preliminary experimental results dashboard |
| `#/acoustic-lab` | Local in-browser audio analysis |
| `#/validation` | Scientific Novelty and Validation |
| `#/timeline` | Research development timeline |
| `#/archive` | Exploratory research archive |
| `#/manuscript` | Manuscript in preparation |
| `#/about` | About the researcher |

## Local installation

Requires Node.js 18 or newer (20 recommended).

```bash
git clone <your-repo-url> aurora
cd aurora
npm install
```

## Development commands

```bash
npm run dev            # local dev server at http://localhost:5173
npm test               # unit tests (linear algebra, FFT, simulator, toy models)
npm run typecheck      # TypeScript checks
npm run validate:data  # checks every JSON file in public/data
```

## Production build

```bash
npm run build     # type-checks, then builds to dist/
npm run preview   # serves dist/ at http://localhost:4173
```

The Vite `base` is `'./'`, so all asset paths are relative and the build works at `https://<user>.github.io/<repository>/` without knowing the repository name. Routing uses `HashRouter` (`/#/results`), so page refreshes and deep links work on GitHub Pages without server rewrites.

## GitHub Pages configuration

1. Push this repository to GitHub with `main` as the default branch.
2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main`. The workflow in `.github/workflows/deploy.yml` validates the data, runs the tests, builds, and deploys. You can also run it manually from the **Actions** tab.
4. The site appears at `https://<user>.github.io/<repository>/`.

To use a custom domain, add a `public/CNAME` file containing the domain and configure DNS as described in GitHub's Pages documentation.

## Where content lives

All research content is stored as JSON in `public/data/`, separate from the components, so the site can be updated without touching code. Each file begins with a `$schema_note` describing its fields.

| File | Content |
|---|---|
| `site.json` | Project identity, status, researcher profile and links |
| `research.json` | Research overview problems and approach |
| `architecture.json` | The ten architecture stages, purposes, and implementation status |
| `modalities.json` | The five sensing modalities |
| `experiments.json` | Experimental results, metric definitions, caveats, provenance |
| `radiative-transfer.json` | libRadtran environment and LUT parameter space |
| `validation.json` | Novelty and validation page content, checklists |
| `timeline.json` | Milestones and statuses |
| `archive.json` | Exploratory ideas |
| `manuscript.json` | Manuscript metadata, sections, and downloadable files |
| `references.json` | Background literature (verify before citing) |

**Provenance and validation fields.** Experiments carry `provenance` (source, data type, whether code and raw data are published) and `validationStatus`. Timeline milestones carry `status` and `statusConfirmed`; architecture stages carry `implementation` and `implementationConfirmed`. Allowed status values are `completed`, `preliminary`, `in-progress`, `planned`, `requires-validation`. `npm run validate:data` enforces these.

### How to modify research content

Edit the relevant JSON file, run `npm run validate:data`, and preview with `npm run dev`. Text changes need no code changes.

### How to add a new experiment

Add an object to `experiments` in `public/data/experiments.json`:

```json
{
  "id": "016",
  "title": "Experiment 016: Short descriptive title",
  "summary": "One sentence on what was tested.",
  "setup": { "measurementBudget": 3, "seeds": 20 },
  "tables": [
    {
      "id": "016-main",
      "title": "Main results",
      "columns": [
        { "key": "strategy", "label": "Strategy" },
        { "key": "ucd", "label": "Unknown-condition detection metric", "numeric": true }
      ],
      "rows": [ { "strategy": "Adaptive", "ucd": 0.5 } ],
      "chart": { "type": "bar", "x": "strategy", "series": ["ucd"] }
    }
  ],
  "interpretation": "…",
  "methodNotes": ["…"],
  "limitations": ["…"],
  "provenance": { "source": "…", "dataType": "computational / synthetic simulation", "codeAvailable": false, "rawDataPublished": false },
  "validationStatus": "preliminary"
}
```

Numeric columns must contain numbers. Add `"unit": "%"` to a table to label percentages. Consider adding a matching milestone in `timeline.json`.

### How to update scientific figures

* Interactive figures are React components in `src/visualizations/` and draw on models in `src/simulations/`.
* Static figures (PNG, SVG) go in `public/figures/`. Reference them with a relative path such as `figures/my-figure.svg`; in components use `publicUrl('figures/my-figure.svg')` from `src/hooks/useData.ts`.
* To show real libRadtran output in the radiative transfer parameter map, save it as `public/data/rt-lut.json` — an array of `{ "aod", "albedo", "sza", "umu", "wavelength", "value" }` objects matching the parameter values — and set `"lutFile": "data/rt-lut.json"` in `radiative-transfer.json`. Cells are then shaded by value. Until then, the site shows no libRadtran values.

### How to upload manuscript files

1. Place files in `public/documents/`, for example `public/documents/aurora-manuscript.pdf`.
2. In `public/data/manuscript.json`, set the matching entry's `path`, for example `"path": "documents/aurora-manuscript.pdf"`. For the reproducibility repository, set `url`.
3. Download buttons stay hidden until the path is set **and** the file exists.
4. Fill each section's `content` (paragraphs separated by a blank line). Only add `doi`, `venue`, or `peerReviewStatus` once they are real.

The CV link works the same way: put the file in `public/documents/` and set the `cv` link's `url` in `site.json` to `documents/<file>.pdf`.

## How to reproduce the illustrative simulations

All illustrative models are deterministic and documented in code:

* **Adaptive sensing simulator** — `src/simulations/adaptiveSensing.ts`. Linear-Gaussian state-space model with a Kalman filter; strategies are fixed (cyclic order), random (seeded), and adaptive (greedy expected information gain per unit cost with a threshold stopping rule). The random generator is Mulberry32 (`src/lib/rng.ts`), so a given seed and settings produce identical results in every browser. `runAll(params)` and `monteCarlo(params, runs)` can be called from a test or a Node script.
* **Spectral explorer** — `src/simulations/spectral.ts`. Hand-built synthetic transmittance and reflectance curves, a toy sensitivity function, and a greedy band selector.
* **Toy inverse problem** — `src/simulations/toyRadiative.ts`. Single-layer analytic approximation. **Not** libRadtran.
* **Acoustic analysis** — `src/lib/fft.ts`. Radix-2 FFT, Welch spectrum, peak picking with parabolic interpolation, spectral-flux transient detection, band-energy fingerprints.

`npm test` exercises these (`src/simulations/simulations.test.ts`), including determinism for a fixed seed and budget compliance.

These models are educational. They are not AURORA's computational experiments and their outputs are not results.

## Repository structure

```
aurora/
  src/
    components/      layout, navigation, shared UI, KaTeX wrapper
    pages/           one component per route
    simulations/     illustrative models + tests
    visualizations/  SVG/Canvas figures
    hooks/           data loading, reduced-motion
    lib/             RNG, linear algebra, FFT
    styles/          Tailwind entry and design tokens
    types/           TypeScript types for the JSON data
  public/
    data/            research content (JSON)
    figures/         static figures
    documents/       manuscript, supplementary files, CV
  scripts/           data validator
  .github/workflows/deploy.yml
```

## Accessibility and privacy

* Keyboard-accessible navigation, skip link, visible focus, ARIA labels on interactive figures, and descriptive figure captions.
* Animations respect `prefers-reduced-motion`.
* The acoustic laboratory decodes and analyses audio locally with the Web Audio API; nothing is uploaded.
* The only external request is Google Fonts; remove the `<link>` tags in `index.html` to self-host or use system fonts.
* Do not commit private research data, unpublished collaborator material, personal contact details, or sensitive institutional information. AURORA is an independent initiative and is not sponsored or endorsed by any university, laboratory, or government agency.

## License

Website source code: MIT (see `LICENSE`). Research content in `public/data`, `public/figures`, and `public/documents` remains the author's work.
