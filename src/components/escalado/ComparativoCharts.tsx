'use client'

import { useMemo } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, ResponsiveContainer, LabelList } from 'recharts'
import { calcularStats } from '@/lib/stats'

const GRUPOS = ['HDP', 'ASC', 'GP', 'SGS']
const COLS: Record<string, string> = { HDP: '#0b5aa5', ASC: '#7c3aed', GP: '#0f9d58', SGS: '#06b6d4' }

export default function ComparativoCharts({ subset }: { subset: any[] }) {
  const data = useMemo(() => {
    const escHDP = subset.filter(r => r.grupoReceptor === 'HDP' && r.escalado && r.minEscalado != null).map(r => r.minEscalado)
    const stHDP = calcularStats(escHDP)

    return GRUPOS.map(g => {
      const casos = subset.filter(r => r.grupoReceptor === g)
      const tiempos = g === 'HDP'
        ? casos.filter(r => r.minEscalado != null).map(r => r.minEscalado)
        : casos.filter(r => r.minPrimerComentario != null).map(r => r.minPrimerComentario)
      const st = g === 'HDP' ? stHDP : calcularStats(tiempos)
      const notas = casos.map(r => r.totalNotas || 0)
      const promNotas = notas.length ? +(notas.reduce((a, b) => a + b, 0) / notas.length).toFixed(1) : 0
      return { grupo: g, mediana: st.mediana ?? 0, promNotas, color: COLS[g] }
    })
  }, [subset])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Mediana 1er nota */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 text-center">
          Mediana 1er nota (min) — HDP: tiempo escalado | Otros: tiempo escalado → 1ra nota grupo
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 50, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="grupo" tick={{ fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              formatter={(v: any) => [`${v} min`, 'Mediana']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <Bar dataKey="mediana" radius={[0, 6, 6, 0]} barSize={28}>
              {data.map(d => <Cell key={d.grupo} fill={d.color} />)}
              <LabelList dataKey="mediana" position="right" formatter={(v: any) => `${v} min`} style={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Notas por caso */}
      <div>
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3 text-center">
          Promedio notas por caso
        </p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data} layout="vertical" margin={{ left: 10, right: 50, top: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
            <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis type="category" dataKey="grupo" tick={{ fontSize: 12, fontWeight: 700 }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              formatter={(v: any) => [v, 'Notas/caso']}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <Bar dataKey="promNotas" radius={[0, 6, 6, 0]} barSize={28}>
              {data.map(d => <Cell key={d.grupo} fill={d.color} opacity={0.75} />)}
              <LabelList dataKey="promNotas" position="right" style={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
