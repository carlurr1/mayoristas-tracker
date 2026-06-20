'use client'
export default function Header() {
  return (
    <header className="bg-[#0b5aa5] px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <span className="text-white font-black text-sm">ETB</span>
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-tight">SF Mayoristas Tracker</h1>
          <p className="text-white/70 text-xs">Help Desk Premium — Seguimiento y escalado de casos</p>
        </div>
      </div>
      <div className="flex items-center gap-2 bg-white/15 px-3 py-1.5 rounded-full">
        <span className="w-2 h-2 rounded-full bg-green-400"></span>
        <span className="text-white/90 text-xs font-semibold">Conectado</span>
      </div>
    </header>
  )
}
