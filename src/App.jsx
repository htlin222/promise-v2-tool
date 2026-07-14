import { useMemo, useState } from 'react'
import {
  Target,
  Network,
  Radar,
  Gauge,
  Ruler,
  Activity,
  FileText,
  ChevronLeft,
  ChevronRight,
  Copy,
  Check,
  Download,
  RotateCcw,
  CircleCheck,
  CircleSlash,
  TriangleAlert,
} from 'lucide-react'
import {
  T_CATEGORIES,
  T2_FOCALITY,
  T3_SUB,
  PRIMARY_SCORES,
  N_CATEGORIES,
  N_REGIONS,
  M_CATEGORIES,
  M1A_REGIONS,
  M1B_PATTERNS,
  M1C_ORGANS,
  EXPRESSION_TIERS,
  RESPONSE_FRAMEWORKS,
  RECIP_RULES,
  PPP_RULES,
} from './data.js'
import { initialState, buildCode, buildReport, therapyGate } from './report.js'

const SCORE_0_3 = ['0', '1', '2', '3'].map((id) => ({ id, label: id }))

const STEPS = [
  { key: 'T', icon: Target, label: 'Tumour', axis: 'miT', title: 'Local tumour' },
  { key: 'N', icon: Network, label: 'Nodes', axis: 'miN', title: 'Pelvic nodes' },
  { key: 'M', icon: Radar, label: 'Metastases', axis: 'miM', title: 'Distant metastases' },
  { key: 'S', icon: Gauge, label: 'Expression', axis: 'score', title: 'PSMA-expression score' },
  { key: 'V', icon: Ruler, label: 'Volume', axis: 'optional', title: 'Tumour volume' },
  { key: 'R', icon: Activity, label: 'Response', axis: 'optional', title: 'Response assessment' },
  { key: 'OUT', icon: FileText, label: 'Report', axis: 'plain text', title: 'Structured report' },
]

/* ---------- small controls ---------- */
function Seg({ options, value, onChange, mono }) {
  return (
    <div className="seg">
      {options.map((o) => (
        <button
          key={o.id}
          type="button"
          className="seg-btn"
          aria-pressed={value === o.id}
          onClick={() => onChange(o.id)}
        >
          <span className={mono ? 'mono' : undefined}>{o.label}</span>
          {o.hint ? <span className="seg-hint">{o.hint}</span> : null}
        </button>
      ))}
    </div>
  )
}

function YesNo({ value, onChange }) {
  return (
    <div className="seg seg-mini">
      {[
        ['no', 'No'],
        ['yes', 'Yes'],
      ].map(([v, l]) => (
        <button
          key={v}
          type="button"
          className="seg-btn"
          aria-pressed={value === v}
          onClick={() => onChange(v)}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

function RegionChips({ defs, value, onToggle, onLat }) {
  return (
    <div className="chips">
      {defs.map((d) => {
        const on = value[d.id] !== undefined
        return (
          <div key={d.id} className={`chip-wrap${on ? ' on' : ''}`}>
            <button type="button" className="chip-btn" aria-pressed={on} onClick={() => onToggle(d.id)}>
              <span className="chip-name">{d.label}</span>
              <span className="chip-code mono">{d.code}</span>
            </button>
            {on && d.lat && (
              <div className="seg seg-mini seg-lat">
                {['L', 'R', 'L/R'].map((sd) => (
                  <button
                    key={sd}
                    type="button"
                    className="seg-btn"
                    aria-pressed={value[d.id] === sd}
                    onClick={() => onLat(d.id, sd)}
                  >
                    {sd}
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint ? <p className="hint">{hint}</p> : null}
    </div>
  )
}

/* ---------- stepper ---------- */
function Stepper({ step, setStep, maxSeen }) {
  return (
    <nav className="stepper" aria-label="Progress">
      <ol className="stepper-track">
        {STEPS.map((s, i) => {
          const Icon = s.icon
          const state = i === step ? 'current' : i < step ? 'done' : 'todo'
          const reachable = i <= maxSeen
          return (
            <li key={s.key} className={`stepnode ${state}`}>
              <button
                type="button"
                className="stepnode-btn"
                disabled={!reachable}
                aria-current={state === 'current' ? 'step' : undefined}
                onClick={() => reachable && setStep(i)}
              >
                <span className="stepnode-mark">
                  {state === 'done' ? <Check size={15} strokeWidth={2.4} /> : <Icon size={15} strokeWidth={1.9} />}
                </span>
                <span className="stepnode-label">{s.label}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

/* ---------- app ---------- */
export default function App() {
  const [state, setState] = useState(initialState)
  const [step, setStepRaw] = useState(0)
  const [maxSeen, setMaxSeen] = useState(0)
  const [copied, setCopied] = useState(false)

  const set = (patch) => setState((s) => ({ ...s, ...patch }))
  const setStep = (i) => {
    const n = Math.max(0, Math.min(STEPS.length - 1, i))
    setStepRaw(n)
    setMaxSeen((m) => Math.max(m, n))
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleArr = (field, id) => {
    const arr = state[field]
    set({ [field]: arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id] })
  }
  const toggleRegion = (field, defs, id) => {
    const cur = { ...state[field] }
    if (cur[id] !== undefined) delete cur[id]
    else {
      const def = defs.find((d) => d.id === id)
      cur[id] = def.lat ? 'L' : true
    }
    set({ [field]: cur })
  }
  const setLat = (field, id, val) => set({ [field]: { ...state[field], [id]: val } })

  const code = useMemo(() => buildCode(state), [state])
  const report = useMemo(() => buildReport(state), [state])
  const gate = useMemo(() => therapyGate(state), [state])

  const tDesc = T_CATEGORIES.find((t) => t.id === state.tCategory)?.desc
  const primaryDesc = PRIMARY_SCORES.find((p) => p.id === state.primaryScore)?.desc

  async function copy() {
    try {
      await navigator.clipboard.writeText(report)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      const ta = document.createElement('textarea')
      ta.value = report
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      try {
        document.execCommand('copy')
        setCopied(true)
        setTimeout(() => setCopied(false), 1800)
      } catch {
        /* ignore */
      }
      document.body.removeChild(ta)
    }
  }

  function download() {
    const blob = new Blob([report], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'promise-v2-report.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  function reset() {
    setState(initialState)
    setStep(0)
    setMaxSeen(0)
  }

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <div className="app">
      <header className="masthead">
        <p className="eyebrow">PROMISE V2 · PSMA-PET</p>
        <h1>miTNM report builder</h1>
        <p className="lede">
          Enter the reads for one scan, one axis at a time. The tool assembles a standardized miTNM
          code and, at the end, a plain-text structured report to copy into your dictation. A reading
          aid — not a diagnostic conclusion.
        </p>
      </header>

      <Stepper step={step} setStep={setStep} maxSeen={maxSeen} />

      <main className="sheet">
        <div className="sheet-head">
          <span className="sheet-axis mono">{current.axis}</span>
          <h2 className="sheet-title">
            <Icon size={19} strokeWidth={1.8} className="sheet-title-icon" aria-hidden="true" />
            {current.title}
          </h2>
          <span className="sheet-count">
            Step {step + 1} <span className="of">/ {STEPS.length}</span>
          </span>
        </div>

        <div className="sheet-body">
          {/* -------- T -------- */}
          {current.key === 'T' && (
            <>
              <Field label="Category">
                <Seg options={T_CATEGORIES} value={state.tCategory} onChange={(v) => set({ tCategory: v })} mono />
                <p className="seg-desc">{tDesc}</p>
              </Field>
              {state.tCategory === 'miT2' && (
                <Field label="Focality">
                  <Seg options={T2_FOCALITY} value={state.tFocality} onChange={(v) => set({ tFocality: v })} />
                </Field>
              )}
              {state.tCategory === 'miT3' && (
                <Field label="Extension">
                  <div className="chips">
                    {T3_SUB.map((o) => {
                      const on = state.t3Sub.includes(o.id)
                      return (
                        <div key={o.id} className={`chip-wrap${on ? ' on' : ''}`}>
                          <button
                            type="button"
                            className="chip-btn"
                            aria-pressed={on}
                            onClick={() => toggleArr('t3Sub', o.id)}
                          >
                            <span className="chip-name">{o.label}</span>
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </Field>
              )}
              {state.tCategory !== 'miTr' ? (
                <Field label="PRIMARY score" hint="Intraprostatic uptake pattern, scored 1–5.">
                  <Seg options={PRIMARY_SCORES} value={state.primaryScore} onChange={(v) => set({ primaryScore: v })} mono />
                  <p className="seg-desc">{primaryDesc}</p>
                </Field>
              ) : (
                <p className="notice">PRIMARY score is not applicable after radical prostatectomy.</p>
              )}
            </>
          )}

          {/* -------- N -------- */}
          {current.key === 'N' && (
            <>
              <Field label="Category">
                <Seg options={N_CATEGORIES} value={state.nCategory} onChange={(v) => set({ nCategory: v })} mono />
              </Field>
              {state.nCategory !== 'miN0' && (
                <Field
                  label="Regions"
                  hint="True-pelvis nodes are regional. miN1 = single region · miN2 = ≥2 regions."
                >
                  <RegionChips
                    defs={N_REGIONS}
                    value={state.nRegions}
                    onToggle={(id) => toggleRegion('nRegions', N_REGIONS, id)}
                    onLat={(id, v) => setLat('nRegions', id, v)}
                  />
                </Field>
              )}
            </>
          )}

          {/* -------- M -------- */}
          {current.key === 'M' && (
            <>
              <Field label="Category">
                <Seg options={M_CATEGORIES} value={state.mCategory} onChange={(v) => set({ mCategory: v })} mono />
              </Field>
              {state.mCategory === 'miM1' && (
                <Field label="Metastatic sites" hint="Select every compartment involved.">
                  <div className="seg">
                    <button type="button" className="seg-btn" aria-pressed={state.m1a} onClick={() => set({ m1a: !state.m1a })}>
                      <span className="mono">miM1a</span> nodes
                    </button>
                    <button type="button" className="seg-btn" aria-pressed={state.m1b} onClick={() => set({ m1b: !state.m1b })}>
                      <span className="mono">miM1b</span> bone
                    </button>
                    <button type="button" className="seg-btn" aria-pressed={state.m1c} onClick={() => set({ m1c: !state.m1c })}>
                      <span className="mono">miM1c</span> other
                    </button>
                  </div>
                </Field>
              )}
              {state.mCategory === 'miM1' && state.m1a && (
                <Field label="miM1a — distant node regions">
                  <RegionChips
                    defs={M1A_REGIONS}
                    value={state.m1aRegions}
                    onToggle={(id) => toggleRegion('m1aRegions', M1A_REGIONS, id)}
                    onLat={(id, v) => setLat('m1aRegions', id, v)}
                  />
                </Field>
              )}
              {state.mCategory === 'miM1' && state.m1b && (
                <Field label="miM1b — bone uptake pattern">
                  <Seg options={M1B_PATTERNS} value={state.m1bPattern} onChange={(v) => set({ m1bPattern: v })} />
                </Field>
              )}
              {state.mCategory === 'miM1' && state.m1c && (
                <Field label="miM1c — organ(s), worst prognosis">
                  <RegionChips
                    defs={M1C_ORGANS}
                    value={state.m1cOrgans}
                    onToggle={(id) => toggleRegion('m1cOrgans', M1C_ORGANS, id)}
                    onLat={() => {}}
                  />
                </Field>
              )}
            </>
          )}

          {/* -------- S : expression -------- */}
          {current.key === 'S' && (
            <>
              <Field label="Highest-uptake lesion">
                <Seg options={SCORE_0_3} value={state.exprHighest} onChange={(v) => set({ exprHighest: v })} mono />
              </Field>
              <Field label="Lowest-uptake lesion">
                <Seg options={SCORE_0_3} value={state.exprLowest} onChange={(v) => set({ exprLowest: v })} mono />
              </Field>
              <table className="ref-table">
                <thead>
                  <tr>
                    <th className="col-key">Score</th>
                    <th>Uptake reference</th>
                    <th className="col-flag">Therapy gate</th>
                  </tr>
                </thead>
                <tbody>
                  {EXPRESSION_TIERS.map((t) => (
                    <tr key={t.id}>
                      <td className="col-key mono">{t.id}</td>
                      <td>
                        {t.name} · {t.uptake}
                      </td>
                      <td className={`col-flag ${t.status === 'Positive' ? 'is-pos' : 'is-neg'}`}>{t.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="hint">Per lesion, a score ≥2 clears the radioligand-therapy uptake gate.</p>
            </>
          )}

          {/* -------- V : volume -------- */}
          {current.key === 'V' && (
            <Field
              label="Total PSMA-positive volume"
              hint="Optional. Exploratory and software-dependent; recommended for clinical trials. Leave blank to omit."
            >
              <div className="num-row">
                <input
                  className="num"
                  type="number"
                  min="0"
                  inputMode="decimal"
                  placeholder="e.g. 25"
                  value={state.volume}
                  onChange={(e) => set({ volume: e.target.value })}
                />
                <span className="num-unit mono">mL</span>
              </div>
            </Field>
          )}

          {/* -------- R : response -------- */}
          {current.key === 'R' && (
            <>
              <Field label="Framework" hint="Optional. Match the ruler to the disease state.">
                <Seg
                  options={RESPONSE_FRAMEWORKS}
                  value={state.responseFramework}
                  onChange={(v) => set({ responseFramework: v })}
                />
              </Field>

              {state.responseFramework === 'recip' && (
                <>
                  <Field label="Total PSMA volume, baseline → current">
                    <div className="num-row">
                      <input
                        className="num"
                        type="number"
                        min="0"
                        inputMode="decimal"
                        placeholder="baseline"
                        value={state.recipBaselineVol}
                        onChange={(e) => set({ recipBaselineVol: e.target.value })}
                      />
                      <span className="num-unit">→</span>
                      <input
                        className="num"
                        type="number"
                        min="0"
                        inputMode="decimal"
                        placeholder="current"
                        value={state.recipCurrentVol}
                        onChange={(e) => set({ recipCurrentVol: e.target.value })}
                      />
                      <span className="num-unit mono">mL</span>
                    </div>
                  </Field>
                  <Field label="New lesions?">
                    <YesNo value={state.recipNewLesions} onChange={(v) => set({ recipNewLesions: v })} />
                  </Field>
                  <table className="ref-table">
                    <tbody>
                      {RECIP_RULES.map((r) => (
                        <tr key={r.cat}>
                          <td className="col-key mono">{r.cat}</td>
                          <td>{r.rule}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}

              {state.responseFramework === 'ppp' && (
                <>
                  <Field label="New PSMA-positive lesions">
                    <div className="num-row">
                      <input
                        className="num"
                        type="number"
                        min="0"
                        step="1"
                        inputMode="numeric"
                        value={state.pppNewLesions}
                        onChange={(e) => set({ pppNewLesions: e.target.value })}
                      />
                      <span className="num-unit">lesions</span>
                    </div>
                  </Field>
                  <Field label="Any lesion size ↑ ≥30%?">
                    <YesNo value={state.pppSizeIncrease} onChange={(v) => set({ pppSizeIncrease: v })} />
                  </Field>
                  <Field label="Clinical / lab consistent with progression?">
                    <YesNo value={state.pppClinical} onChange={(v) => set({ pppClinical: v })} />
                  </Field>
                  <table className="ref-table">
                    <tbody>
                      {PPP_RULES.map((r) => (
                        <tr key={r.cat}>
                          <td className="col-key mono">{r.cat}</td>
                          <td>{r.rule}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </>
              )}
            </>
          )}

          {/* -------- OUT : report -------- */}
          {current.key === 'OUT' && (
            <>
              <div className="code-line">
                <span className="code-line-tag mono">miTNM</span>
                <span className="code-line-val mono">{code}</span>
              </div>

              {gate.h !== null && (
                <div className={`verdict ${gate.hasTarget ? 'pos' : 'neg'}`}>
                  {gate.hasTarget ? <CircleCheck size={17} strokeWidth={2} /> : <CircleSlash size={17} strokeWidth={2} />}
                  <span>
                    <strong>{gate.hasTarget ? 'Therapy gate — eligible.' : 'Therapy gate — below threshold.'}</strong>{' '}
                    {gate.hasTarget
                      ? '≥1 lesion scores ≥2; radioligand-therapy target present.'
                      : 'No lesion scores ≥2; below the radioligand-therapy uptake threshold.'}
                  </span>
                </div>
              )}
              {gate.hasCold && (
                <div className="verdict warn">
                  <TriangleAlert size={17} strokeWidth={2} />
                  <span>
                    Low-uptake lesion present (score ≤1). Heterogeneity is an adverse prognostic signal;
                    consider FDG-PET if a PSMA-negative phenotype is suspected.
                  </span>
                </div>
              )}

              <div className="report-head">
                <span className="report-head-label mono">plain-text report</span>
                <div className="report-actions">
                  <button type="button" className={`btn btn-primary${copied ? ' copied' : ''}`} onClick={copy}>
                    {copied ? <Check size={15} strokeWidth={2.4} /> : <Copy size={15} strokeWidth={1.9} />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={download} title="Download .txt">
                    <Download size={15} strokeWidth={1.9} />
                  </button>
                </div>
              </div>
              <pre className="report-pre">{report}</pre>
            </>
          )}
        </div>

        {/* -------- nav footer -------- */}
        <div className="sheet-foot">
          <button type="button" className="btn btn-ghost" onClick={() => setStep(step - 1)} disabled={step === 0}>
            <ChevronLeft size={16} strokeWidth={1.9} />
            Back
          </button>

          {!isLast && current.key !== 'OUT' && (
            <span className="foot-code mono" title="miTNM code so far">
              {code}
            </span>
          )}

          {isLast ? (
            <button type="button" className="btn btn-ghost" onClick={reset}>
              <RotateCcw size={15} strokeWidth={1.9} />
              Start over
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={() => setStep(step + 1)}>
              {step === STEPS.length - 2 ? 'Build report' : 'Next'}
              <ChevronRight size={16} strokeWidth={1.9} />
            </button>
          )}
        </div>
      </main>

      <footer className="foot">
        <p>
          Framework — Seifert R, et al. <em>Second version of the PROMISE framework (PROMISE V2)</em>. Eur
          Urol 2023;83:405–412. Response — RECIP 1.0 (Gafita A, et al. J Nucl Med 2022;63:1651–1658). The
          therapy gate (<span className="mono">score ≥2</span>) operationalizes the VISION uptake criterion
          (Sartor O, et al. NEJM 2021).
        </p>
        <p className="foot-warn">
          A structured reading aid. It does not make a diagnosis and does not replace review of the source
          images.
        </p>
      </footer>
    </div>
  )
}
