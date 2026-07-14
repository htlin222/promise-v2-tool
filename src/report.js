import {
  PRIMARY_SCORES,
  N_REGIONS,
  M1A_REGIONS,
  M1B_PATTERNS,
  M1C_ORGANS,
  EXPRESSION_TIERS,
} from './data.js'

export const initialState = {
  // T
  tCategory: 'miT2',
  tFocality: 'u', // for miT2: u | m
  t3Sub: ['a'], // for miT3: subset of ['a','b']
  primaryScore: '4',
  // N
  nCategory: 'miN0',
  nRegions: {}, // { [id]: 'L' | 'R' | 'L/R' | true }
  // M
  mCategory: 'miM0',
  m1a: false,
  m1aRegions: {},
  m1b: false,
  m1bPattern: 'uni',
  m1c: false,
  m1cOrgans: {}, // { [id]: true }
  // Expression
  exprHighest: '3',
  exprLowest: '1',
  // Volume
  volume: '',
  // Response
  responseFramework: 'none',
  recipBaselineVol: '',
  recipCurrentVol: '',
  recipNewLesions: 'no',
  pppNewLesions: '0',
  pppSizeIncrease: 'no',
  pppClinical: 'no',
}

const T_MEANING = {
  miT0: 'no local tumour',
  miT2: 'organ-confined tumour',
  miT3: 'non–organ-confined tumour',
  miT4: 'tumour invades adjacent structures',
  miTr: 'local recurrence after radical prostatectomy',
}

function regionString(obj, defs) {
  return defs
    .filter((d) => obj[d.id] !== undefined)
    .map((d) => {
      const v = obj[d.id]
      if (d.lat && typeof v === 'string') return `${d.code}-${v}`
      return d.code
    })
    .join(', ')
}

// ---- T ----
export function codeT(s) {
  let t = s.tCategory
  if (t === 'miT2' && s.tFocality) t += s.tFocality
  if (t === 'miT3' && s.t3Sub.length) t += [...s.t3Sub].sort().join('')
  return t
}

// ---- miTNM code string ----
export function buildCode(s) {
  const parts = []

  // T
  let tStr = codeT(s)
  if (s.tCategory !== 'miTr' && s.primaryScore) tStr += ` (PRIMARY ${s.primaryScore})`
  parts.push(tStr)

  // N
  if (s.nCategory === 'miN0') {
    parts.push('miN0')
  } else {
    const r = regionString(s.nRegions, N_REGIONS)
    parts.push(`${s.nCategory}${r ? ` (${r})` : ''}`)
  }

  // M
  if (s.mCategory === 'miM0') {
    parts.push('miM0')
  } else {
    const mParts = []
    if (s.m1a) {
      const r = regionString(s.m1aRegions, M1A_REGIONS)
      mParts.push(`miM1a${r ? ` (${r})` : ''}`)
    }
    if (s.m1b) mParts.push(`miM1b${s.m1bPattern ? ` (${s.m1bPattern})` : ''}`)
    if (s.m1c) {
      const o = M1C_ORGANS.filter((x) => s.m1cOrgans[x.id]).map((x) => x.code).join(', ')
      mParts.push(`miM1c${o ? ` (${o})` : ''}`)
    }
    parts.push(mParts.length ? mParts.join(' ') : 'miM1')
  }

  let code = parts.join(' ')
  if (s.volume !== '' && !Number.isNaN(Number(s.volume))) code += ` / ${s.volume} mL`
  if (s.exprHighest !== '' || s.exprLowest !== '') {
    code += ` / PSMA expression score highest ${s.exprHighest || '—'} lowest ${s.exprLowest || '—'}`
  }
  return code
}

// ---- Expression / therapy gate ----
export function tierOf(score) {
  return EXPRESSION_TIERS.find((t) => t.id === String(score)) || null
}

export function therapyGate(s) {
  const h = parseInt(s.exprHighest, 10)
  const l = parseInt(s.exprLowest, 10)
  return {
    h: Number.isNaN(h) ? null : h,
    l: Number.isNaN(l) ? null : l,
    hasTarget: !Number.isNaN(h) && h >= 2,
    hasCold: !Number.isNaN(l) && l < 2,
  }
}

// ---- RECIP 1.0 ----
export function computeRecip(s) {
  const base = parseFloat(s.recipBaselineVol)
  const cur = parseFloat(s.recipCurrentVol)
  if (Number.isNaN(base) || Number.isNaN(cur) || base <= 0) return null
  const newLes = s.recipNewLesions === 'yes'
  if (cur === 0) return { cat: 'CR', pct: -100, base, cur, newLes }
  const pct = ((cur - base) / base) * 100
  let cat
  if (pct <= -30 && !newLes) cat = 'PR'
  else if (pct >= 20 && newLes) cat = 'PD'
  else cat = 'SD'
  return { cat, pct, base, cur, newLes }
}

const RECIP_TEXT = {
  CR: 'complete disappearance of PSMA uptake',
  PR: 'volume ↓ ≥30% without new lesions',
  PD: 'volume ↑ ≥20% with new lesions',
  SD: 'change between the PR and PD thresholds',
}

// ---- PPP ----
export function computePpp(s) {
  const n = parseInt(s.pppNewLesions, 10)
  const newCount = Number.isNaN(n) ? 0 : n
  const size = s.pppSizeIncrease === 'yes'
  const clin = s.pppClinical === 'yes'
  let pd = false
  const why = []
  if (size && clin) {
    pd = true
    why.push('lesion ↑ ≥30% with consistent clinical/lab')
  }
  if (newCount >= 2) {
    pd = true
    why.push('≥2 new PSMA-positive lesions')
  }
  if (newCount === 1 && clin) {
    pd = true
    why.push('1 new lesion with consistent clinical/lab')
  }
  return { cat: pd ? 'PD' : 'non-PD', newCount, size, clin, why }
}

// ---- Human-readable reads ----
function readT(s) {
  let line = `${codeT(s)} — ${T_MEANING[s.tCategory]}`
  if (s.tCategory === 'miT2' && s.tFocality) {
    line += ` (${s.tFocality === 'u' ? 'unifocal' : 'multifocal'})`
  }
  if (s.tCategory === 'miT3' && s.t3Sub.length) {
    const subs = s.t3Sub
      .map((x) => (x === 'a' ? 'extracapsular extension' : 'seminal-vesicle invasion'))
      .join(' + ')
    line += ` (${subs})`
  }
  if (s.tCategory === 'miTr') {
    line += '. PRIMARY score not applicable after RP'
  } else if (s.primaryScore) {
    const p = PRIMARY_SCORES.find((x) => x.id === s.primaryScore)
    line += `. PRIMARY score ${s.primaryScore}${p ? ` (${p.desc.toLowerCase()})` : ''}`
  }
  return line
}

function readN(s) {
  if (s.nCategory === 'miN0') return 'miN0 — no positive pelvic nodes'
  const named = N_REGIONS.filter((d) => s.nRegions[d.id] !== undefined).map((d) => {
    const v = s.nRegions[d.id]
    const side = d.lat && typeof v === 'string' ? ` (${v})` : ''
    return `${d.label}${side}`
  })
  const list = named.length ? named.join(', ') : 'region unspecified'
  const cat = s.nCategory === 'miN1' ? 'single region' : '≥2 regions'
  return `${s.nCategory} — ${cat}: ${list}. (true-pelvis nodes = regional)`
}

function readM(s) {
  if (s.mCategory === 'miM0') return 'miM0 — no distant metastasis'
  const chunks = []
  if (s.m1a) {
    const named = M1A_REGIONS.filter((d) => s.m1aRegions[d.id] !== undefined).map((d) => {
      const v = s.m1aRegions[d.id]
      const side = d.lat && typeof v === 'string' ? ` (${v})` : ''
      return `${d.label}${side}`
    })
    chunks.push(`miM1a distant nodes: ${named.length ? named.join(', ') : 'region unspecified'}`)
  }
  if (s.m1b) {
    const p = M1B_PATTERNS.find((x) => x.id === s.m1bPattern)
    chunks.push(`miM1b bone${p ? `, ${p.label.toLowerCase()}` : ''}`)
  }
  if (s.m1c) {
    const organs = M1C_ORGANS.filter((x) => s.m1cOrgans[x.id]).map((x) => x.label.replace(/\s*\(.*\)/, ''))
    chunks.push(`miM1c ${organs.length ? organs.join(', ').toLowerCase() : 'other site'} (worst-prognosis site)`)
  }
  return chunks.length ? chunks.join('; ') : 'miM1 — distant metastasis (subtype unspecified)'
}

function readExpression(s) {
  const parts = []
  const hi = tierOf(s.exprHighest)
  const lo = tierOf(s.exprLowest)
  if (hi) parts.push(`highest ${s.exprHighest} (${hi.name.toLowerCase()}, ${hi.uptake} — ${hi.status.toLowerCase()})`)
  if (lo) parts.push(`lowest ${s.exprLowest} (${lo.name.toLowerCase()}, ${lo.uptake} — ${lo.status.toLowerCase()})`)
  return parts.join('; ')
}

function pad(label) {
  return (label + ' '.repeat(19)).slice(0, 19)
}

// ---- Full plain-text report ----
export function buildReport(s) {
  const now = new Date().toISOString().slice(0, 10)
  const gate = therapyGate(s)
  const L = []

  L.push('PROMISE V2 — PSMA-PET STRUCTURED REPORT')
  L.push(`Generated ${now}`)
  L.push('')
  L.push('miTNM CODE')
  L.push(`  ${buildCode(s)}`)
  L.push('')
  L.push('READS')
  L.push(`  ${pad('Local tumour (T)')}: ${readT(s)}`)
  L.push(`  ${pad('Pelvic nodes (N)')}: ${readN(s)}`)
  L.push(`  ${pad('Distant mets (M)')}: ${readM(s)}`)
  if (s.volume !== '' && !Number.isNaN(Number(s.volume))) {
    L.push(`  ${pad('Tumour volume')}: ${s.volume} mL PSMA-VOL (exploratory; software-dependent)`)
  }
  const expr = readExpression(s)
  if (expr) L.push(`  ${pad('PSMA-expression')}: ${expr}`)
  L.push('')

  // Therapy gate
  L.push('THERAPY GATE  (per lesion, score ≥2 = eligible)')
  if (gate.hasTarget) {
    L.push('  POSITIVE — ≥1 lesion scores ≥2: PSMA radioligand-therapy target present.')
  } else if (gate.h !== null) {
    L.push('  NEGATIVE — no lesion scores ≥2: below the radioligand-therapy threshold.')
  } else {
    L.push('  Expression score not entered.')
  }
  if (gate.hasCold) {
    L.push('  Caution: a low-uptake lesion is present (score ≤1). Heterogeneity is an adverse')
    L.push('  prognostic signal; consider FDG-PET if a PSMA-negative phenotype is suspected.')
  }
  L.push('')

  // Response
  if (s.responseFramework === 'recip') {
    const r = computeRecip(s)
    L.push('RESPONSE  (RECIP 1.0 — advanced disease / mCRPC)')
    if (r) {
      const sign = r.pct > 0 ? '+' : ''
      L.push(
        `  Baseline PSMA-VOL ${r.base} mL -> current ${r.cur} mL (${sign}${r.pct.toFixed(1)}%); ` +
          `new lesions: ${r.newLes ? 'yes' : 'no'}.`
      )
      L.push(`  Category: RECIP-${r.cat} (${RECIP_TEXT[r.cat]}).`)
    } else {
      L.push('  Enter baseline and current total PSMA volume to classify.')
    }
    L.push('')
  } else if (s.responseFramework === 'ppp') {
    const p = computePpp(s)
    L.push('RESPONSE  (PPP — limited disease / mHSPC)')
    L.push(
      `  New PSMA-positive lesions: ${p.newCount}; lesion size ↑ ≥30%: ${p.size ? 'yes' : 'no'}; ` +
        `clinical/lab consistent: ${p.clin ? 'yes' : 'no'}.`
    )
    L.push(`  Category: PPP-${p.cat}${p.why.length ? ` (${p.why.join('; ')})` : ''}.`)
    L.push('')
  }

  L.push('—')
  L.push('Framework: PROMISE V2 (Seifert R, et al. Eur Urol 2023;83:405-412).')
  if (s.responseFramework === 'recip') L.push('Response: RECIP 1.0 (Gafita A, et al. J Nucl Med 2022;63:1651-1658).')
  L.push('Structured reading aid — not a diagnostic conclusion. Verify against source images.')

  return L.join('\n')
}
