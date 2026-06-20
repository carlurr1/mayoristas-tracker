'use client'

import { useState, useCallback, useMemo } from 'react'
import KpiCard from '../ui/KpiCard'
import { Card, CardTitle } from '../ui/Card'
import GrupoCards from './GrupoCards'
import GrupoTable from './GrupoTable'
import IngenieroTable from './IngenieroTable'
import ClienteTable from './ClienteTable'
import ComparativoCharts from './ComparativoCharts'
import CasosTable from './CasosTable'
import { calcularStats } from '@/lib/stats'

export default function EscaladoPanel() {
  const [data, setData]         = useState<any>(null)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)
  const [busq, setBusq]         = useState('')
  const [tipoFiltro, setTipo]   = useState('all')
  const [grupoFiltro, setGrupo] = useState('all')
  const [colorFiltro, setColor] = useState('all')

  const cargar = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch('/api/escalado')
      const json = await res.json()
      if (!json.ok) throw new Error(json.error)
      setData(json)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const subset = useMemo(() => {
    if (!data?.rows) return []
    let rows = data.rows as any[]
    if (busq.trim()) {
      const q = busq.trim().toLowerCase()
      rows = rows.filter(r =>
        (r.cliente||'').toLowerCase().includes(q) ||
        (r.ingeniero||'').toLowerCase().includes(q) ||
        (r.nit||'').includes(q) ||
        (r.caseNumber||'').includes(q)
      )
    }
    if (tipoFiltro === 'escalado')    rows = rows.filter(r => r.escalado)
    if (tipoFiltro === 'sin_escalar') rows = rows.filter(r => !r.escalado)
    if (tipoFiltro === 'abierto')     rows = rows.filter(r => r.tipoEstado === 'abierto')
    if (tipoFiltro === 'cerrado')     rows = rows.filter(r => r.tipoEstado === 'cerrado')
    if (grupoFiltro !== 'all')        rows = rows.filter(r => r.grupoReceptor === grupoFiltro)
    if (colorFiltro !== 'all')        rows = rows.filter(r => r.colorEsc === colorFiltro)
    return rows
  }, [data, busq, tipoFiltro, grupoFiltro, colorFiltro])

  // KPIs from subset
  const kpis = useMemo(() => {
    const escalados = subset.filter(r => r.escalado)
    const tiempos = escalados.map(r => r.minEscalado).filter((v: any) => v !== null)
    const st = calcularStats(tiempos)
    return {
      total:     subset.length,
      abiertos:  subset.filter(r => r.tipoEstado === 'abierto').length,
      cerrados:  subset.filter(r => r.tipoEstado === 'cerrado').length,
      escalados: escalados.length,
      verde:     subset.filter(r => r.colorEsc === 'verde').length,
      amarillo:  subset.filter(r => r.colorEsc === 'amarillo').length,
      rojo:      subset.filter(r => r.colorEsc === 'rojo').length,
      mediana:   st.mediana,
      p90:       st.p90,
    }
  }, [subset])

  const GRUPOS = ['HDP','ASC','GP','SGS','AISV','CX']

  if (!data) return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-5 py-3 text-sm font-medium max-w-md text-center">{error}</div>}
      <button
        onClick={cargar}
        disabled={loading}
        className="bg-[#0b5aa5] hover:bg-[#0a4f91] text-white font-bold px-8 py-3 rounded-xl transition-all disabled:opacity-60 text-sm"
      >
        {loading ? 'Cargando datos de Salesforce...' : '↺ Cargar datos'}
      </button>
      {loading && <p className="text-slate-400 text-sm">Esto puede tomar 30-60 segundos...</p>}
    </div>
  )

  return (
    <div className="flex flex-col gap-4">

      {/* ── Toolbar ── */}
      <Card>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="text"
              placeholder="🔍 Ingeniero, cliente o caso..."
              value={busq}
              onChange={e => setBusq(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-2 text-sm w-64 focus:outline-none focus:border-[#0b5aa5]"
            />
            {busq && (
              <button onClick={() => setBusq('')} className="text-xs text-slate-400 hover:text-red-500 font-semibold">✕ Limpiar</button>
            )}
            <div className="flex gap-1 flex-wrap">
              {[{k:'all',l:'Todos'},{k:'abierto',l:'Abiertos'},{k:'cerrado',l:'Cerrados'},{k:'escalado',l:'Escalados'},{k:'sin_escalar',l:'Sin escalar'}].map(f => (
                <button key={f.k} onClick={() => setTipo(f.k)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${tipoFiltro===f.k ? 'bg-[#0b5aa5] text-white border-[#0b5aa5]' : 'border-slate-200 text-slate-500 hover:border-[#0b5aa5] hover:text-[#0b5aa5]'}`}>
                  {f.l}
                </button>
              ))}
            </div>
            <div className="flex gap-1 flex-wrap">
              {(['all',...GRUPOS,'Sin grupo']).map(g => (
                <button key={g} onClick={() => setGrupo(g)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${grupoFiltro===g ? 'bg-[#0b5aa5] text-white border-[#0b5aa5]' : 'border-slate-200 text-slate-500 hover:border-[#0b5aa5] hover:text-[#0b5aa5]'}`}>
                  {g === 'all' ? 'Todos' : g}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={cargar} disabled={loading}
              className="bg-[#0b5aa5] hover:bg-[#0a4f91] text-white text-xs font-bold px-4 py-2 rounded-lg transition-all disabled:opacity-60">
              {loading ? '...' : '↺ Actualizar'}
            </button>
            <span className="text-xs text-slate-400 self-center">
              {data.updatedAt}
            </span>
          </div>
        </div>
      </Card>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <KpiCard label="Total casos" value={kpis.total} variant="azul" />
        <KpiCard label="Abiertos" value={kpis.abiertos} variant="azul" />
        <KpiCard label="Cerrados" value={kpis.cerrados} variant="default" />
        <KpiCard label="Escalados" value={kpis.escalados} variant="azul" />
        <KpiCard label="Verde <10m" value={kpis.verde} variant="verde" onClick={() => setColor(colorFiltro==='verde'?'all':'verde')} active={colorFiltro==='verde'} />
        <KpiCard label="Amarillo" value={kpis.amarillo} variant="amarillo" onClick={() => setColor(colorFiltro==='amarillo'?'all':'amarillo')} active={colorFiltro==='amarillo'} />
        <KpiCard label="Rojo >20m" value={kpis.rojo} variant="rojo" onClick={() => setColor(colorFiltro==='rojo'?'all':'rojo')} active={colorFiltro==='rojo'} />
        <KpiCard label="Mediana HDP" value={kpis.mediana ? `${kpis.mediana} min` : '-'} variant="azul" />
      </div>

      {/* ── Gestión post-escalado ── */}
      <Card>
        <CardTitle>Gestión post-escalado por grupo receptor</CardTitle>
        <GrupoCards subset={subset} />
        <div className="mt-4">
          <GrupoTable subset={subset} />
        </div>
      </Card>

      {/* ── Comparativo charts ── */}
      <Card>
        <CardTitle>Comparativo de tiempos por grupo (mediana del período)</CardTitle>
        <ComparativoCharts subset={subset} />
      </Card>

      {/* ── Tablas ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardTitle>Por ingeniero</CardTitle>
          <IngenieroTable subset={subset} thresholds={data.thresholds} />
        </Card>
        <Card>
          <CardTitle>Por cliente</CardTitle>
          <ClienteTable subset={subset} />
        </Card>
      </div>

      {/* ── Detalle de casos ── */}
      <Card>
        <CardTitle>Detalle de casos — {busq ? `filtrando: "${busq}" · ` : ''}{subset.length} de {data.rows.length}</CardTitle>
        <CasosTable rows={subset} />
      </Card>

    </div>
  )
}
