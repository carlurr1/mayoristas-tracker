'use client'

import { useState, useCallback } from 'react'
import { Card, CardTitle } from '../ui/Card'
import KpiCard from '../ui/KpiCard'

const COLOR_LABEL: Record<string, string> = { critical: 'Rojo', warning: 'Amarillo', healthy: 'Verde' }
const COLOR_BADGE: Record<string, string> = {
  critical: 'bg-red-100 text-red-700',
  warning:  'bg-amber-100 text-amber-700',
  healthy:  'bg-green-100 text-green-700',
}

export default function SemaforoPanel() {
  const [data, setData]       = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState<string | null>(null)
  const [filter, setFilter]   = useState<string>('all')

  const cargar = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/semaforo')
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      setData(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  if (!data) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-3 text-sm font-medium max-w-md text-center">{error}</div>}
      <button onClick={cargar} disabled={loading}
        className="bg-[#0b5aa5] hover:bg-[#0a4f91] text-white font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-60 text-sm">
        {loading ? 'Cargando casos activos...' : '↺ Cargar semáforo'}
      </button>
      {loading && <p className="text-slate-400 text-sm">Consultando Salesforce...</p>}
    </div>
  )

  const s = data.summary || {}
  const rows = (data.rows || []).filter((r: any) => filter === 'all' || r.color === filter)

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex gap-2 flex-wrap">
            {['all','critical','warning','healthy'].map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filter===f ? 'bg-[#0b5aa5] text-white border-[#0b5aa5]' : 'border-slate-200 text-slate-500 hover:border-[#0b5aa5] hover:text-[#0b5aa5]'}`}>
                {f === 'all' ? 'Todos' : COLOR_LABEL[f]}
              </button>
            ))}
          </div>
          <div className="flex gap-2 items-center">
            <button onClick={cargar} disabled={loading}
              className="bg-[#0b5aa5] hover:bg-[#0a4f91] text-white text-xs font-bold px-4 py-2 rounded-lg disabled:opacity-60">
              {loading ? '...' : '↺ Actualizar'}
            </button>
            <span className="text-xs text-slate-400">{data.updatedAt}</span>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard label="Total activos" value={s.total || 0} variant="azul" />
        <KpiCard label="Crítico — sin seguimiento" value={s.critical || 0} variant="rojo"
          onClick={() => setFilter(filter === 'critical' ? 'all' : 'critical')} active={filter === 'critical'} />
        <KpiCard label="En atención" value={s.warning || 0} variant="amarillo"
          onClick={() => setFilter(filter === 'warning' ? 'all' : 'warning')} active={filter === 'warning'} />
        <KpiCard label="Al día" value={s.healthy || 0} variant="verde"
          onClick={() => setFilter(filter === 'healthy' ? 'all' : 'healthy')} active={filter === 'healthy'} />
      </div>

      <Card>
        <CardTitle>Casos activos — {rows.length} {filter !== 'all' ? `(${COLOR_LABEL[filter]})` : ''}</CardTitle>
        <div className="overflow-auto rounded-lg border border-slate-200" style={{ maxHeight: 520 }}>
          <table className="w-full text-xs" style={{ minWidth: 900 }}>
            <thead className="sticky top-0">
              <tr className="bg-slate-50 border-b-2 border-slate-200">
                {['Estado','Caso','Cliente','Ingeniero','Última nota','Horas sin seguimiento','Total notas'].map(h => (
                  <th key={h} className="px-3 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r: any) => (
                <tr key={r.caseId} className="border-b border-slate-100 hover:bg-slate-50">
                  <td className="px-3 py-2.5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${COLOR_BADGE[r.color]}`}>
                      {COLOR_LABEL[r.color] || r.color}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <div className="font-bold text-slate-700">{r.caseNumber}</div>
                    <div className="text-slate-400 text-[10px] truncate max-w-[140px]">{r.subject}</div>
                  </td>
                  <td className="px-3 py-2.5 text-slate-600 max-w-[120px] truncate">{r.clientName}</td>
                  <td className="px-3 py-2.5 text-slate-600 whitespace-nowrap">{r.ownerName}</td>
                  <td className="px-3 py-2.5">
                    <div className="text-slate-500 text-[10px]">{r.noteLastModifiedDateFmt}</div>
                    <div className="text-slate-400 text-[10px] truncate max-w-[180px]">{r.notePreview?.substring(0, 60)}</div>
                  </td>
                  <td className="px-3 py-2.5">
                    {r.hoursWithoutFollowup != null ? (
                      <strong className={r.color === 'healthy' ? 'text-green-600' : r.color === 'warning' ? 'text-amber-600' : 'text-red-600'}>
                        {r.hoursWithoutFollowup}h
                      </strong>
                    ) : <span className="text-slate-400">-</span>}
                  </td>
                  <td className="px-3 py-2.5 text-center text-slate-600">-</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
