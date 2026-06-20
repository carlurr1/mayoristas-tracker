'use client'

import { useState } from 'react'
import Header from './ui/Header'
import NavTabs from './ui/NavTabs'
import EscaladoPanel from './escalado/EscaladoPanel'
import SemaforoPanel from './semaforo/SemaforoPanel'

type Tab = 'semaforo' | 'escalado'

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>('escalado')

  return (
    <div className="min-h-screen bg-[#f0f2f7]">
      <Header />
      <NavTabs active={tab} onChange={setTab} />
      <main className="max-w-[1600px] mx-auto px-6 py-5">
        {tab === 'escalado' && <EscaladoPanel />}
        {tab === 'semaforo' && <SemaforoPanel />}
      </main>
    </div>
  )
}
