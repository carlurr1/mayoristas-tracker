import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'SF Mayoristas Tracker — ETB',
  description: 'Semáforo y escalado de casos Salesforce — HDP Mayoristas ETB',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  )
}
