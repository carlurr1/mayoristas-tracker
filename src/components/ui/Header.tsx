'use client'

export default function Header() {
  return (
    <header className="bg-[#0b5aa5] px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
          <span className="text-white font-black text-sm tracking-tight">ETB</span>
        </div>
        <div>
          <h1 className="text-white font-bold text-base leading-tight tracking-tight">
            SF Mayoristas Tracker
          </h1>
          <p className="text-white/60 text-xs mt-0.5">
            Help Desk Premium — Seguimiento y escalado de casos Salesforce
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 text-white/70 text-xs">
          <span>Salesforce</span>
          <span className="text-white/30">·</span>
          <span>Colombia Mayoristas</span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-3 py-1.5 rounded-full">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
          <span className="text-white/90 text-xs font-semibold">En línea</span>
        </div>
      </div>
    </header>
  )
}
