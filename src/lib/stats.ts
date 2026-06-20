export interface Stats {
  n: number
  media: number | null
  mediana: number | null
  p75: number | null
  p90: number | null
  min: number | null
  max: number | null
}

export function calcularStats(tiempos: number[]): Stats {
  if (!tiempos.length) return { n:0, media:null, mediana:null, p75:null, p90:null, min:null, max:null }
  const s = [...tiempos].sort((a, b) => a - b)
  const n = s.length
  const suma = s.reduce((a, b) => a + b, 0)
  const pct = (p: number) => {
    const idx = (p / 100) * (n - 1)
    const lo = Math.floor(idx), hi = Math.ceil(idx)
    return lo === hi ? +s[lo].toFixed(2) : +(s[lo] + (s[hi] - s[lo]) * (idx - lo)).toFixed(2)
  }
  return { n, media: +(suma/n).toFixed(2), mediana: pct(50), p75: pct(75), p90: pct(90), min: +s[0].toFixed(2), max: +s[n-1].toFixed(2) }
}

export function esHDP(titulo: string, preview: string): boolean {
  const firma = preview.substring(0, 50).toUpperCase()
  const p200  = preview.substring(0, 200).toUpperCase()
  if (/^HDP/.test(firma))               return true
  if (/^DP\s+[A-Z]/.test(firma))        return true
  if (/^HD[\s:|]/.test(firma))          return true
  if (/SEGUIMIENTO\s+HDP/.test(p200))   return true
  if (/\bHDP[A-Z:|]/.test(firma))       return true
  return false
}

export function normalizarGrupo(texto: string): string | null {
  if (!texto) return null
  const t = texto.trim().toUpperCase()
  const parte = t.indexOf(':') > 0 ? t.substring(0, t.indexOf(':')).trim() : t.split(/[\s_]+/).slice(0,5).join(' ')
  const sinPref = parte.replace(/^SEGUIMIENTO\s+/, '').trim()

  const MAPA: Record<string, string> = {
    'HDP':'HDP','ASC':'ASC','GP':'GP','CX':'CX','AISV':'AISV','SGS':'SGS',
    'TE':'GP','BBV':'GP','CE':'GP','BBV CE':'GP',
    'SEGUIMIENTO TE':'GP','SEGUIMIENTO HDP':'HDP','SEGUIMIENTO ASC':'ASC',
    'SEGUIMIENTO GP':'GP','SEGUIMIENTO CX':'CX','SEGUIMIENTO AISV':'AISV',
    'SEGUIMIENTO SGS':'SGS','REMEDY':'HDP','SEGUIMIENTO REMEDY':'HDP',
  }

  const tokens = Object.keys(MAPA).sort((a, b) => b.length - a.length)
  for (const token of tokens) {
    const re = new RegExp(`(^|[\\s_])${token.replace(/\s+/g,'[\\s_]+')}([\\s_:]|$)`, 'i')
    if (re.test(parte) || re.test(sinPref)) return MAPA[token]
  }
  return null
}

export function fmtMin(min: number | null): string {
  if (min === null) return '-'
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), m = Math.round(min % 60)
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}
