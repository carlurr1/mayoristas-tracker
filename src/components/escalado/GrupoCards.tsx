'use client'

import { useMemo } from 'react'
import { calcularStats } from '@/lib/stats'

const COLS: Record<string, string> = {
  HDP: '#0b5aa5', ASC: '#7c3aed', GP: '#0f9d58', SGS: '#06b6d4', AISV: '#ea4335', CX: '#f79009'
}

function recalc(subset: any[]) {
  const m: Record<string, any> = {}
  const escHDP = subset.filter(r => r.grupoReceptor === 'HDP' && r.escalado && r.minEscalado != null).map(r => r.minEscalado)
  const stHDP = calcularStats(escHDP)

  subset.forEach(r => {
    const g = r.grupoReceptor || 'Sin grupo'
    if (!m[g]) m[g] = { casos: 0, conResp: 0, minsPrim: [], freqs: [], totalNotas: 0 }
    m[g].casos++
    m[g].totalNotas += (r.totalNotas || 0)
    const t = g === 'HDP' ? r.minEscalado : r.minPrimerComentario
    if (t != null) { m[g].minsPrim.push(t); m[g].conResp++ }
    if (r.frecuenciaNotas != null) m[g].freqs.push(r.frecuenciaNotas)
  })

  const total = subset.length || 1
  return Object.keys(m).filter(k => k !== 'Sin grupo').map(k => {
    const d = m[k]
    const sp = calcularStats(d.minsPrim), sf = calcularStats(d.freqs)
    return {
      grupo: k, casos: d.casos, conResp: d.conResp, total,
      mediaPrim:    k === 'HDP' ? stHDP.media    : sp.media,
      medianaPrim:  k === 'HDP' ? stHDP.mediana  : sp.mediana,
      mediaFreq: sf.media,
      promNotasPorCaso: d.casos > 0 ? +(d.totalNotas / d.casos).toFixed(1) : 0,
    }
  }).sort((a, b) => b.casos - a.casos)
}

export default function GrupoCards({ subset }: { subset: any[] }) {
  const stats = useMemo(() => recalc(subset), [subset])
  const total = subset.length || 1

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map(g => {
        const col = COLS[g.grupo] || '#66758a'
        const pct = +(g.casos / total * 100).toFixed(1)
        const mp  = g.medianaPrim, mf = g.mediaFreq
        const label = g.grupo === 'HDP' ? '1er nota post-esc (mediana)' : '1er nota grupo (mediana)'
        return (
          <div key={g.grupo} className="border border-slate-200 rounded-xl p-4" style={{ borderTopWidth: 3, borderTopColor: col }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-lg font-black" style={{ color: col }}>{g.grupo}</span>
              <span className="text-2xl font-black" style={{ color: col }}>{pct}%</span>
            </div>
            <div className="text-xs text-slate-400 mb-2">{g.casos} de {total} casos</div>
            <div className="bg-slate-100 rounded-full h-1.5 mb-3">
              <div className="h-1.5 rounded-full transition-all" style={{ width: `${pct}%`, background: col }} />
            </div>
            <div className="text-xs text-slate-500 space-y-1">
              <div>{label}: <strong className="text-slate-700">{mp != null ? `${mp} min` : '-'}</strong></div>
              <div>Frec. notas: <strong className="text-slate-700">{mf != null ? `${mf}h` : '-'}</strong></div>
              <div>Notas/caso: <strong className="text-slate-700">{g.promNotasPorCaso}</strong></div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
