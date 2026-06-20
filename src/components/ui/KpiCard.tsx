import clsx from 'clsx'

type Variant = 'verde' | 'amarillo' | 'rojo' | 'azul' | 'default'

const VARIANTS: Record<Variant, string> = {
  verde:    'border-l-4 border-l-green-500  bg-green-50',
  amarillo: 'border-l-4 border-l-amber-500  bg-amber-50',
  rojo:     'border-l-4 border-l-red-500    bg-red-50',
  azul:     'border-l-4 border-l-[#0b5aa5]  bg-blue-50',
  default:  'border border-slate-200',
}

const VALUE_COLORS: Record<Variant, string> = {
  verde:    'text-green-600',
  amarillo: 'text-amber-600',
  rojo:     'text-red-600',
  azul:     'text-[#0b5aa5]',
  default:  'text-slate-800',
}

interface Props {
  label: string
  value: string | number
  sub?: string
  variant?: Variant
  onClick?: () => void
  active?: boolean
}

export default function KpiCard({ label, value, sub, variant = 'default', onClick, active }: Props) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-xl p-4 flex flex-col gap-1 transition-all',
        VARIANTS[variant],
        onClick && 'cursor-pointer hover:shadow-md hover:-translate-y-0.5',
        active && 'ring-2 ring-[#0b5aa5] ring-offset-1'
      )}
    >
      <span className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{label}</span>
      <span className={clsx('text-3xl font-black tracking-tight leading-none', VALUE_COLORS[variant])}>{value}</span>
      {sub && <span className="text-[11px] text-slate-400 mt-0.5">{sub}</span>}
    </div>
  )
}
