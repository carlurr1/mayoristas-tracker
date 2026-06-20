'use client'

import { useState } from 'react'

const COLOR_BADGE: Record<string, string> = {
  verde:      'bg-green-100 text-green-700',
  amarillo:   'bg-amber-100 text-amber-700',
  rojo:       'bg-red-100 text-red-700',
  sin_escalar:'bg-slate-100 text-slate-500',
}

const GRUPO_COLS: Record<string, string> = {
  HDP: '#0b5aa5', ASC: '#7c3aed', GP: '#0f9d58', SGS: '#06b6d4', AISV: '#ea4335', CX: '#f79009'
}

export default function CasosTable({ rows }: { rows: any[] }) {
  const [selected, setSelected] = useState<any | null>(null)

  return (
    <div className="flex gap-4">
      {/* Table */}
      <div className={`overflow-auto rounded-lg border border-slate-200 ${selected ? 'flex-1' : 'w-full'}`} style={{ maxHeight: 480 }}>
        <table className="w-full text-xs" style={{ minWidth: selected ? 700 : 1100 }}>
          <thead className="sticky top-0">
            <tr className="bg-slate-50 border-b-2 border-slate-200">
              {['Semáf.','Caso','Estado','Cliente','Ingeniero','Grupo','Creado','Fecha envío','Min HDP','Min grupo','Notas'].map(h => (
                <th key={h} className="px-2.5 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr
                key={r.caseId}
                onClick={() => setSelected(selected?.caseId === r.caseId ? null : r)}
                className={`border-b border-slate-100 cursor-pointer hover:bg-blue-50 transition-colors ${selected?.caseId === r.caseId ? 'bg-blue-50' : ''}`}
              >
                <td className="px-2.5 py-2">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${COLOR_BADGE[r.colorEsc] || 'bg-slate-100 text-slate-500'}`}>
                    {r.colorEsc === 'verde' ? 'Verde' : r.colorEsc === 'amarillo' ? 'Amarillo' : r.colorEsc === 'rojo' ? 'Rojo' : 'Sin esc.'}
                  </span>
                </td>
                <td className="px-2.5 py-2">
                  <div className="font-bold text-slate-700">{r.caseNumber}</div>
                  <div className="text-slate-400 text-[10px] truncate max-w-[120px]">{r.subject}</div>
                </td>
                <td className="px-2.5 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${r.tipoEstado === 'abierto' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'}`}>
                    {r.tipoEstado === 'abierto' ? 'Abierto' : 'Cerrado'}
                  </span>
                </td>
                <td className="px-2.5 py-2 max-w-[100px] truncate text-slate-600">{r.cliente}</td>
                <td className="px-2.5 py-2 text-slate-600 whitespace-nowrap">{r.ingeniero}</td>
                <td className="px-2.5 py-2">
                  {r.grupoReceptor && (
                    <span className="font-bold text-xs" style={{ color: GRUPO_COLS[r.grupoReceptor] || '#64748b' }}>{r.grupoReceptor}</span>
                  )}
                </td>
                <td className="px-2.5 py-2 text-slate-500 whitespace-nowrap text-[10px]">{r.createdDateFmt?.substring(0, 16)}</td>
                <td className="px-2.5 py-2 text-slate-500 whitespace-nowrap text-[10px]">{r.fechaEnvioFmt?.substring(0, 16) || 'No escalado'}</td>
                <td className="px-2.5 py-2">
                  {r.minEscalado != null ? (
                    <strong className={r.colorEsc === 'verde' ? 'text-green-600' : r.colorEsc === 'amarillo' ? 'text-amber-600' : 'text-red-600'}>
                      {r.minEscalado}
                    </strong>
                  ) : '-'}
                </td>
                <td className="px-2.5 py-2 text-slate-500">{r.minPrimerComentario ?? '-'}</td>
                <td className="px-2.5 py-2 text-center text-slate-600">{r.totalNotas}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Timeline panel */}
      {selected && (
        <div className="w-80 shrink-0 border border-slate-200 rounded-xl overflow-hidden" style={{ maxHeight: 480 }}>
          <div className="bg-[#0b5aa5] px-4 py-2.5 flex items-center justify-between">
            <div>
              <div className="text-white font-bold text-sm">{selected.caseNumber}</div>
              <div className="text-white/70 text-xs">{selected.cliente}</div>
            </div>
            <button onClick={() => setSelected(null)} className="text-white/70 hover:text-white text-lg leading-none">×</button>
          </div>
          <div className="p-3 bg-slate-50 text-xs border-b border-slate-200">
            <div className="text-slate-500">
              Creado: <strong className="text-slate-700">{selected.createdDateFmt?.substring(0, 16)}</strong>
            </div>
            {selected.minEscalado && (
              <div className="text-slate-500 mt-0.5">
                Min escalado: <strong className={selected.colorEsc === 'verde' ? 'text-green-600' : selected.colorEsc === 'amarillo' ? 'text-amber-600' : 'text-red-600'}>{selected.minEscalado} min</strong>
              </div>
            )}
            {selected.minPrimerComentario && (
              <div className="text-slate-500 mt-0.5">
                1ra nota grupo: <strong className="text-[#0b5aa5]">{selected.minPrimerComentario} min</strong>
              </div>
            )}
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
            {(selected.timeline || []).map((n: any, i: number) => {
              const col = GRUPO_COLS[n.grupo] || '#64748b'
              return (
                <div key={i} className="border-b border-slate-100 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: col + '18', color: col }}>{n.grupo}</span>
                    <span className="text-[10px] text-slate-400">{n.fechaFmt?.substring(0, 16)}</span>
                  </div>
                  <div className="text-xs font-semibold text-slate-600 mb-0.5">{n.titulo}</div>
                  <div className="text-[11px] text-slate-500 line-clamp-3">{n.preview}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
