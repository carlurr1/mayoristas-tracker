'use client'
import { useMemo } from 'react'
import { calcularStats } from '@/lib/stats'

const COLS: Record<string, string> = {
  HDP: '#0b5aa5', ASC: '#7c3aed', GP: '#0f9d58', SGS: '#06b6d4', AISV: '#ea4335', CX: '#f79009'
}

export default function GrupoTable({ subset }: { subset: any[] }) {
  const stats = useMemo(() => {
    const m: Record<string, any> = {}
    const escHDP = subset.filter(r => r.grupoReceptor === 'HDP' && r.escalado && r.minEscalado != null).map(r => r.minEscalado)
    const stHDP = calcularStats(escHDP)
    subset.forEach(r => {
      const g = r.grupoReceptor || 'Sin grupo'
      if (!m[g]) m[g] = { casos: 0, minsPrim: [], freqs: [], totalNotas: 0 }
      m[g].casos++
      m[g].totalNotas += (r.totalNotas || 0)
      const t = g === 'HDP' ? r.minEscalado : r.minPrimerComentario
      if (t != null) m[g].minsPrim.push(t)
      if (r.frecuenciaNotas != null) m[g].freqs.push(r.frecuenciaNotas)
    })
    const total = subset.length || 1
    return Object.keys(m).filter(k => k !== 'Sin grupo').map(k => {
      const d = m[k], sp = calcularStats(d.minsPrim), sf = calcularStats(d.freqs)
      return {
        grupo: k, casos: d.casos, pct: +(d.casos / total * 100).toFixed(1),
        media:    k === 'HDP' ? stHDP.media   : sp.media,
        mediana:  k === 'HDP' ? stHDP.mediana : sp.mediana,
        p90:      k === 'HDP' ? stHDP.p90     : sp.p90,
        freq:     sf.media,
        notasPorCaso: d.casos > 0 ? +(d.totalNotas / d.casos).toFixed(1) : 0,
        total,
      }
    }).sort((a, b) => b.casos - a.casos)
  }, [subset])

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b-2 border-slate-200">
            {['Grupo','Casos','% Total','Media 1er nota (min)','Mediana','P90','Frec. (h)','Notas/caso'].map(h => (
              <th key={h} className="px-3 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {stats.map(g => (
            <tr key={g.grupo} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2.5 font-bold" style={{ color: COLS[g.grupo] || '#64748b' }}>{g.grupo}</td>
              <td className="px-3 py-2.5 font-semibold text-slate-700">{g.casos}</td>
              <td className="px-3 py-2.5">
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ background: (COLS[g.grupo] || '#64748b') + '18', color: COLS[g.grupo] || '#64748b' }}>
                  {g.pct}%
                </span>
              </td>
              <td className="px-3 py-2.5 text-slate-600">{g.media ?? '-'}</td>
              <td className="px-3 py-2.5 font-semibold text-slate-700">{g.mediana ?? '-'}</td>
              <td className="px-3 py-2.5 text-slate-600">{g.p90 ?? '-'}</td>
              <td className="px-3 py-2.5 text-slate-600">{g.freq != null ? `${g.freq}h` : '-'}</td>
              <td className="px-3 py-2.5 text-slate-600">{g.notasPorCaso}</td>
            </tr>
          ))}
          <tr className="bg-slate-50 font-bold border-t-2 border-slate-200">
            <td className="px-3 py-2.5 text-slate-700">Total</td>
            <td className="px-3 py-2.5 text-slate-700">{subset.length}</td>
            <td className="px-3 py-2.5 text-slate-500">100%</td>
            <td colSpan={5} />
          </tr>
        </tbody>
      </table>
    </div>
  )
}
