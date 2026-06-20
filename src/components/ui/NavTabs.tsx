'use client'

const TABS = [
  { key: 'semaforo', label: '🚦 Semáforo' },
  { key: 'escalado', label: '📊 Escalado HDP' },
]

export default function NavTabs({ active, onChange }: { active: string; onChange: (t: any) => void }) {
  return (
    <div className="bg-white border-b border-slate-200 shadow-sm px-6 flex items-center justify-between">
      <div className="flex gap-0">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => onChange(t.key)}
            className={`px-6 py-3.5 text-sm font-semibold border-b-[3px] transition-all relative top-px ${
              active === t.key
                ? 'text-[#0b5aa5] border-[#0b5aa5]'
                : 'text-slate-500 border-transparent hover:text-[#0b5aa5] hover:bg-[#e6f0fa]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <span className="text-xs text-slate-400 font-medium">HDP Mayoristas ETB · {new Date().toLocaleDateString('es-CO', { month: 'long', year: 'numeric' })}</span>
    </div>
  )
}
