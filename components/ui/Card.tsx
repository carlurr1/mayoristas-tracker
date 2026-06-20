import { ReactNode } from 'react'
import clsx from 'clsx'

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={clsx('bg-white border border-slate-200 rounded-xl p-5', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-[11px] font-bold tracking-widest uppercase text-slate-400">{children}</span>
      <div className="flex-1 h-px bg-slate-100" />
    </div>
  )
}

export function SectionHeader({ children, sub }: { children: ReactNode; sub?: string }) {
  return (
    <div className="bg-[#0b5aa5] rounded-t-xl px-4 py-2.5 flex items-center justify-between">
      <h2 className="text-[11px] font-bold tracking-widest uppercase text-white">{children}</h2>
      {sub && <span className="text-white/70 text-xs">{sub}</span>}
    </div>
  )
}
