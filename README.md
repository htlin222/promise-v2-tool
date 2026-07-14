# PROMISE V2 — miTNM report builder

A stepwise, single-page tool for reading one PSMA-PET scan. Work through the axes one at a
time — **T · N · M · expression · volume · response** — and the tool assembles a standardized
**miTNM code** and, at the end, a **plain-text structured report** to copy into your dictation.
It also flags the radioligand-therapy gate (expression score ≥2). Vite + React, no backend,
no tracking.

**Live:** https://promise-v2.hsiehting.com

> Structured reading aid only — it does not make a diagnosis and does not replace review of the
> source images.

## Design

Academic-minimal: near-monochrome ink on paper, a serif/sans/mono type triad, lucide icons,
and a register-style step flow. The plain-text report is the deliverable.

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # → dist/
npm run preview  # serve the production build
```

Requires Node 18+.

## Deployment (Cloudflare Pages)

The site deploys to Cloudflare Pages. The project name is **`promise-v2`** and the custom
domain is **`promise-v2.hsiehting.com`** (see `wrangler.toml`).

### Automatic (GitHub Actions)

Every push to `main` builds and deploys via `.github/workflows/deploy.yml`. It needs two
repository secrets:

| Secret | Value |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | A token with **Account → Cloudflare Pages → Edit** |
| `CLOUDFLARE_ACCOUNT_ID` | The Cloudflare account ID |

### Manual (wrangler)

```bash
npm run build
npx wrangler pages deploy dist --project-name=promise-v2 --branch=main
```

## What it encodes

Transcribed from the PROMISE V2 framework:

- **miTNM** — T (focality / a·b and PRIMARY score), N (node regions + laterality), M
  (miM1a nodes · miM1b bone pattern · miM1c organ), optional PSMA-VOL, and highest/lowest
  expression score. Seifert R, et al. *Second version of the PROMISE framework (PROMISE V2)*.
  Eur Urol 2023;83:405–412.
- **PSMA-expression score** (per lesion, ≥2 = radioligand-therapy target) — Seifert R, et al.
  Theranostics 2020; operationalized against the VISION uptake criterion (Sartor O, et al.
  NEJM 2021;385:1091–1103).
- **Response** — RECIP 1.0 (Gafita A, et al. J Nucl Med 2022;63:1651–1658) and PPP.

The response classifiers use deliberately simple inputs (total-volume change and new-lesion
flags); treat them as a structured aid, not a validated volumetric engine.

## Project layout

```
├── index.html
├── wrangler.toml              Cloudflare Pages project + output dir
├── .github/workflows/deploy.yml   push-to-main auto-deploy
└── src/
    ├── main.jsx      React entry
    ├── App.jsx       stepwise wizard UI
    ├── data.js       PROMISE V2 domain constants (transcribed tables)
    ├── report.js     pure logic: code string, gate, RECIP/PPP, report text
    └── index.css     academic-minimal design system
```
