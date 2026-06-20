import { NextResponse } from 'next/server'
import { sfLogin, sfQuery, chunkArray, safeValue, fmtLocal } from '@/lib/salesforce'
import { NIT_SET, NIT_INFO } from '@/lib/nits'

export const dynamic = 'force-dynamic'
export const maxDuration = 300

const OWNER_IDS = ['0054y0000073yg6AAA', '005f3000004xi12AAA']
const ACTIVE_STATUSES = ['Abierto','En Progreso','En espera Documentación','En espera de Cliente',
  'En espera Proveedor','Rechazado','Confirmado','Para Confirmar','Asignado','Resuelto']
const LINK_CHUNK = 20
const NOTE_CHUNK = 30

function hoursSince(d: string): number {
  return (Date.now() - new Date(d).getTime()) / 3600000
}

function bucket(hrs: number | null, cfg: any, hasNote: boolean) {
  if (!hasNote) return 'critical'
  if (hrs === null) return 'critical'
  if (hrs >= cfg.redHours)    return 'critical'
  if (hrs >= cfg.orangeHours) return 'warning'
  return 'healthy'
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const cfg = {
    redHours:    parseFloat(searchParams.get('redHours')    || '8'),
    orangeHours: parseFloat(searchParams.get('orangeHours') || '5'),
    yellowHours: parseFloat(searchParams.get('yellowHours') || '3'),
    greenHours:  parseFloat(searchParams.get('greenHours')  || '2'),
  }

  try {
    const session = await sfLogin()
    const ownerClause  = OWNER_IDS.map(id => `'${id}'`).join(',')
    const statusClause = ACTIVE_STATUSES.map(s => `'${s.replace(/'/g, "\\'")}'`).join(',')

    const caseRes = await sfQuery(session, `
      SELECT Id, CaseNumber, Subject, Status, OwnerId, Owner.Name,
             Account.Name, Contact.Name, CreatedDate, LastModifiedDate,
             Id_Sistema_Legado__c
      FROM Case
      WHERE OwnerId IN (${ownerClause}) AND Status IN (${statusClause})
      ORDER BY CreatedDate ASC LIMIT 500`)

    const cases = caseRes.records || []
    const caseIds = cases.map((c: any) => c.Id)

    let links: any[] = []
    for (const chunk of chunkArray(caseIds, LINK_CHUNK)) {
      if (!chunk.length) continue
      const ids = chunk.map((id: string) => `'${id}'`).join(',')
      try {
        const lr = await sfQuery(session, `
          SELECT LinkedEntityId, ContentDocumentId, ContentDocument.Title,
                 ContentDocument.FileType, ContentDocument.LastModifiedDate
          FROM ContentDocumentLink WHERE LinkedEntityId IN (${ids})`)
        links.push(...(lr.records || []))
      } catch {}
    }

    const noteDocIdsByCase: Record<string, string[]> = {}
    const noteDocIds: Record<string, true> = {}
    for (const r of links) {
      if (safeValue(r.ContentDocument?.FileType) === 'SNOTE') {
        if (!noteDocIdsByCase[r.LinkedEntityId]) noteDocIdsByCase[r.LinkedEntityId] = []
        noteDocIdsByCase[r.LinkedEntityId].push(r.ContentDocumentId)
        noteDocIds[r.ContentDocumentId] = true
      }
    }

    const notesById: Record<string, any> = {}
    for (const chunk of chunkArray(Object.keys(noteDocIds), NOTE_CHUNK)) {
      if (!chunk.length) continue
      const ids = chunk.map(id => `'${id}'`).join(',')
      try {
        const nr = await sfQuery(session, `SELECT Id, Title, TextPreview, CreatedDate, LastModifiedDate FROM ContentNote WHERE Id IN (${ids})`)
        for (const n of nr.records || []) notesById[n.Id] = n
      } catch {}
    }

    const rows = cases.map((c: any) => {
      const linkedNotes = (noteDocIdsByCase[c.Id] || [])
        .map(id => notesById[id]).filter(Boolean)
        .sort((a: any, b: any) => new Date(b.LastModifiedDate).getTime() - new Date(a.LastModifiedDate).getTime())
      const latest = linkedNotes[0] ?? null
      const hasNote = !!latest
      const hrs = latest ? hoursSince(latest.LastModifiedDate) : null
      const color = bucket(hrs, cfg, hasNote)
      const nit = safeValue(c.AccountNumber__c ?? '').trim()
      return {
        caseId:         c.Id,
        caseNumber:     c.CaseNumber,
        legacySystemId: c.Id_Sistema_Legado__c || '',
        subject:        c.Subject || '',
        status:         c.Status || '',
        ownerId:        c.OwnerId || '',
        ownerName:      c.Owner?.Name || '',
        clientName:     c.Account?.Name || c.Contact?.Name || '',
        createdDate:    c.CreatedDate,
        createdDateFmt: fmtLocal(c.CreatedDate),
        noteTitle:      latest?.Title || 'Sin seguimiento',
        notePreview:    latest?.TextPreview || 'Sin seguimiento',
        noteLastModifiedDateFmt: latest ? fmtLocal(latest.LastModifiedDate) : 'Sin seguimiento',
        hoursWithoutFollowup: hrs !== null ? +hrs.toFixed(2) : null,
        color, hasNote,
      }
    }).sort((a: any, b: any) => {
      const av = a.hoursWithoutFollowup ?? 999999
      const bv = b.hoursWithoutFollowup ?? 999999
      return bv - av
    })

    const summary = rows.reduce((acc: any, r: any) => {
      acc[r.color] = (acc[r.color] || 0) + 1
      acc.total++
      return acc
    }, { critical:0, warning:0, healthy:0, total:0 })

    return NextResponse.json({ ok:true, summary, rows, updatedAt: fmtLocal(new Date()), config: cfg, activeStatuses: ACTIVE_STATUSES })
  } catch (err: any) {
    return NextResponse.json({ ok:false, error: err.message }, { status: 500 })
  }
}
