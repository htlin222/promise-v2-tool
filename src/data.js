// PROMISE V2 domain constants, transcribed from:
// Seifert R, et al. Eur Urol 2023;83:405-412 (Table 1, Table 2) and the
// PSMA-expression score (Seifert R, et al. Theranostics 2020).

export const T_CATEGORIES = [
  { id: 'miT0', label: 'miT0', desc: 'No local tumour' },
  { id: 'miT2', label: 'miT2', desc: 'Organ-confined tumour' },
  { id: 'miT3', label: 'miT3', desc: 'Non–organ-confined tumour' },
  { id: 'miT4', label: 'miT4', desc: 'Invades adjacent structures (sphincter, rectum, bladder, levator, pelvic wall)' },
  { id: 'miTr', label: 'miTr', desc: 'Local recurrence after radical prostatectomy' },
]

export const T2_FOCALITY = [
  { id: 'u', label: 'Unifocal' },
  { id: 'm', label: 'Multifocal' },
]

export const T3_SUB = [
  { id: 'a', label: 'Extracapsular (a)' },
  { id: 'b', label: 'Seminal vesicle (b)' },
]

export const PRIMARY_SCORES = [
  { id: '1', label: '1', desc: 'No dominant intraprostatic pattern; low-grade activity' },
  { id: '2', label: '2', desc: 'Diffuse transition-zone / symmetrical central-zone activity, not reaching the margin' },
  { id: '3', label: '3', desc: 'Focal transition-zone activity, visually ×2 above background' },
  { id: '4', label: '4', desc: 'Focal peripheral-zone activity (no minimum intensity)' },
  { id: '5', label: '5', desc: 'Intense uptake (very high, or SUVmax >12)' },
]

export const N_CATEGORIES = [
  { id: 'miN0', label: 'miN0', desc: 'No positive pelvic nodes' },
  { id: 'miN1', label: 'miN1', desc: 'Single node region' },
  { id: 'miN2', label: 'miN2', desc: '≥2 node regions' },
]

// True-pelvis node regions = regional disease.
export const N_REGIONS = [
  { id: 'II', code: 'II', label: 'Internal iliac', lat: true },
  { id: 'EI', code: 'EI', label: 'External iliac', lat: true },
  { id: 'OB', code: 'OB', label: 'Obturator', lat: true },
  { id: 'PS', code: 'PS', label: 'Presacral', lat: false },
  { id: 'OP', code: 'OP', label: 'Other pelvic', lat: false },
]

export const M_CATEGORIES = [
  { id: 'miM0', label: 'miM0', desc: 'No distant metastasis' },
  { id: 'miM1', label: 'miM1', desc: 'Distant metastasis (specify a / b / c)' },
]

// miM1a — distant node regions (common iliac and above).
export const M1A_REGIONS = [
  { id: 'CI', code: 'CI', label: 'Common iliac', lat: true },
  { id: 'RP', code: 'RP', label: 'Retroperitoneal', lat: false },
  { id: 'SD', code: 'SD', label: 'Supradiaphragmatic', lat: false },
  { id: 'OE', code: 'OE', label: 'Inguinal / other extrapelvic', lat: false },
]

// miM1b — bone, with uptake pattern.
export const M1B_PATTERNS = [
  { id: 'uni', code: 'uni', label: 'Unifocal' },
  { id: 'oligo', code: 'oligo', label: 'Oligometastatic (n≤3)' },
  { id: 'diss', code: 'diss', label: 'Disseminated' },
  { id: 'dmi', code: 'dmi', label: 'Diffuse marrow' },
]

// miM1c — other sites (visceral / pleural / peritoneal).
export const M1C_ORGANS = [
  { id: 'hep', code: 'hep', label: 'Liver (hep)' },
  { id: 'pul', code: 'pul', label: 'Lung (pul)' },
  { id: 'adrenal', code: 'adrenal', label: 'Adrenal' },
  { id: 'brain', code: 'brain', label: 'Brain' },
  { id: 'other', code: 'other', label: 'Other (pleura / peritoneum)' },
]

// PSMA-expression score, per lesion. ≥2 = positive (radioligand-therapy target).
export const EXPRESSION_TIERS = [
  { id: '0', name: 'No', uptake: '≤ blood pool', status: 'Negative' },
  { id: '1', name: 'Low', uptake: '≤ liver & > blood pool', status: 'Negative' },
  { id: '2', name: 'Intermediate', uptake: '≤ parotid & > liver', status: 'Positive' },
  { id: '3', name: 'High', uptake: '> parotid gland', status: 'Positive' },
]

export const RESPONSE_FRAMEWORKS = [
  { id: 'none', label: 'None' },
  { id: 'recip', label: 'RECIP 1.0', hint: 'advanced / mCRPC' },
  { id: 'ppp', label: 'PPP', hint: 'limited / mHSPC' },
]

// Reference thresholds shown in-app.
export const RECIP_RULES = [
  { cat: 'CR', rule: 'No PSMA uptake on PET' },
  { cat: 'PR', rule: 'Total volume ↓ ≥30%, no new lesions' },
  { cat: 'PD', rule: 'Total volume ↑ ≥20% AND new lesions' },
  { cat: 'SD', rule: 'Everything else' },
]

export const PPP_RULES = [
  { cat: 'PD', rule: 'Any lesion ↑ ≥30% + clinical/lab; OR ≥2 new lesions; OR 1 new lesion + clinical/lab' },
  { cat: 'non-PD', rule: 'All other' },
]
