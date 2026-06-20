import { NextResponse } from 'next/server'
import { sfLogin, sfQuery, safeValue, fmtLocal } from '@/lib/salesforce'
import { normalizarGrupo } from '@/lib/stats'

export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const caseId = searchParams.get('caseId')
  if (!caseId) return NextResponse.json({ ok:false, error:'Sin caseId' }, { status: 400 })

  try {
    const session = await sfLogin()
    const links = await sfQuery(session,
      `SELECT ContentDocumentId, ContentDocument.Title, ContentDocument.FileType,
       ContentDocument.CreatedDate FROM ContentDocumentLink WHERE LinkedEntityId = '${caseId}'`)

    const noteIds = (links.records || [])
      .filter((r: any) => r.ContentDocument?.FileType === 'SNOTE')
      .map((r: any) => r.ContentDocumentId)

    if (!noteIds.length) return NextResponse.json({ ok:true, timeline:[] })

    const clause = noteIds.map((id: string) => `'${id}'`).join(',')
    const notes  = await sfQuery(session, `SELECT Id, Title, TextPreview, CreatedDate FROM ContentNote WHERE Id IN (${clause})`)
    const sorted = (notes.records || []).sort((a: any, b: any) => new Date(a.CreatedDate).getTime() - new Date(b.CreatedDate).getTime())

    return NextResponse.json({ ok:true, timeline: sorted.map((n: any) => ({
      titulo:   safeValue(n.Title),
      preview:  safeValue(n.TextPreview || ''),
      grupo:    normalizarGrupo(safeValue(n.Title)) ?? 'Sin grupo',
      fecha:    n.CreatedDate,
      fechaFmt: fmtLocal(n.CreatedDate),
    }))})
  } catch (err: any) {
    return NextResponse.json({ ok:false, error: err.message }, { status: 500 })
  }
}
