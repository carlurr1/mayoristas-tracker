'use client'

import { useMemo, useState } from 'react'
import { calcularStats } from '@/lib/stats'

export default function IngenieroTable({ subset, thresholds }: { subset: any[]; thresholds: any }) {
  const [sort, setSort] = useState<{ col: string; dir: 1 | -1 }>({ col: 'total', dir: -1 })

  const rows = useMemo(() => {
    const m: Record<string, any> = {}
    subset.filter(r => r.escalado).forEach(r => {
      const ing = r.ingeniero || 'Sin asignar'
      if (!m[ing]) m[ing] = { nombre: ing, tiempos: [], verde: 0, amarillo: 0, rojo: 0 }
      m[ing].tiempos.push(r.minEscalado)
      m[ing][r.colorEsc]++
    })
    return Object.values(m).map((d: any) => {
      const st = calcularStats(d.tiempos)
      const tot = d.tiempos.length
      return { ...d, total: tot, pctVerde: tot > 0 ? +(d.verde / tot * 100).toFixed(1) : 0, media: st.media, mediana: st.mediana, p90: st.p90 }
    })
  }, [subset])

  const sorted = useMemo(() => {
    return [...rows].sort((a, b) => ((a[sort.col] ?? 0) > (b[sort.col] ?? 0) ? sort.dir : -sort.dir))
  }, [rows, sort])

  const toggleSort = (col: string) => setSort(s => ({ col, dir: s.col === col ? (-s.dir as 1 | -1) : -1 }))

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200 max-h-72">
      <table className="w-full text-xs">
        <thead className="sticky top-0">
          <tr className="bg-slate-50 border-b-2 border-slate-200">
            {[{k:'nombre',l:'Ingeniero'},{k:'total',l:'Total'},{k:'verde',l:'Verde'},{k:'amarillo',l:'Amarillo'},{k:'rojo',l:'Rojo'},{k:'pctVerde',l:'% Verde'},{k:'media',l:'Media'},{k:'mediana',l:'Mediana'},{k:'p90',l:'P90'}].map(h => (
              <th key={h.k} className="px-3 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wide cursor-pointer whitespace-nowrap hover:text-[#0b5aa5]" onClick={() => toggleSort(h.k)}>
                {h.l} {sort.col === h.k ? (sort.dir === -1 ? '↓' : '↑') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(r => (
            <tr key={r.nombre} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-3 py-2.5 font-semibold text-slate-700 whitespace-nowrap">{r.nombre}</td>
              <td className="px-3 py-2.5 text-slate-600">{r.total}</td>
              <td className="px-3 py-2.5 font-bold text-green-600">{r.verde}</td>
              <td className="px-3 py-2.5 font-bold text-amber-600">{r.amarillo}</td>
              <td className="px-3 py-2.5 font-bold text-red-600">{r.rojo}</td>
              <td className="px-3 py-2.5">
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${r.pctVerde >= 70 ? 'bg-green-100 text-green-700' : r.pctVerde >= 40 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>
                  {r.pctVerde}%
                </span>
              </td>
              <td className="px-3 py-2.5 text-slate-600">{r.media ?? '-'}</td>
              <td className="px-3 py-2.5 font-semibold text-slate-700">{r.mediana ?? '-'}</td>
              <td className="px-3 py-2.5 text-slate-600">{r.p90 ?? '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
