import { NextResponse } from 'next/server'
import { sfLogin, sfQuery, chunkArray, safeValue, fmtLocal } from '@/lib/salesforce'
import { NIT_SET, NIT_INFO } from '@/lib/nits'
import { calcularStats, esHDP, normalizarGrupo } from '@/lib/stats'

const LINK_CHUNK  = 20
const NOTE_CHUNK  = 30
const ESC_VERDE   = 10
const ESC_AMARILLO = 20

export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET() {
  try {
    const session = await sfLogin()
    const now = new Date()
    const primerDia = new Date(now.getFullYear(), now.getMonth(), 1)
      .toLocaleDateString('sv-SE', { timeZone: 'America/Bogota' })
    const fechaMes = `${primerDia}T00:00:00.000-0500`

    const SELECT = `SELECT Id, CaseNumber, Subject, Status, IsClosed,
      AccountNumber__c, Account.Name, CreatedDate, ClosedDate,
      Fecha_Envio_Sistema_Legado__c, LTE_ModeloComercial__c, DEG_Categoria__c,
      Grupo_Aseguramiento__c, Grupo_Aseguramiento__r.Name, Id_Sistema_Legado__c `

    const nitList = Object.keys(NIT_SET)
    const recAb: any[] = [], recCer: any[] = []

    for (let ci = 0; ci < nitList.length; ci += 80) {
      const nitClause = nitList.slice(ci, ci + 80).map(n => `'${n}'`).join(',')
      const base = `FROM Case WHERE AccountNumber__c IN (${nitClause}) AND RecordType.Name = 'SOPORTE TECNICO' AND Status != 'Cancelado' `
      try {
        const rA = await sfQuery(session, SELECT + base + `AND IsClosed = false AND CreatedDate >= ${fechaMes} ORDER BY CreatedDate ASC LIMIT 300`)
        recAb.push(...(rA.records || []))
      } catch {}
      try {
        const rC = await sfQuery(session, SELECT + base + `AND IsClosed = true AND ClosedDate >= ${fechaMes} ORDER BY ClosedDate ASC LIMIT 300`)
        recCer.push(...(rC.records || []))
      } catch {}
    }

    const seen = new Set<string>()
    const cases: any[] = []
    for (const c of [...recAb, ...recCer]) {
      if (!seen.has(c.Id)) { seen.add(c.Id); cases.push(c) }
    }

    // Fetch notes
    const caseIds = cases.map(c => c.Id)
    let links: any[] = []
    for (const chunk of chunkArray(caseIds, LINK_CHUNK)) {
      if (!chunk.length) continue
      const ids = chunk.map(id => `'${id}'`).join(',')
      try {
        const lr = await sfQuery(session,
          `SELECT LinkedEntityId, ContentDocumentId, ContentDocument.Title,
           ContentDocument.FileType, ContentDocument.CreatedDate
           FROM ContentDocumentLink WHERE LinkedEntityId IN (${ids})`)
        links.push(...(lr.records || []))
      } catch {}
    }

    const noteIdsByCase: Record<string, string[]> = {}
    const allNoteIds: Record<string, true> = {}
    for (const r of links) {
      if (safeValue(r.ContentDocument?.FileType) === 'SNOTE') {
        if (!noteIdsByCase[r.LinkedEntityId]) noteIdsByCase[r.LinkedEntityId] = []
        noteIdsByCase[r.LinkedEntityId].push(r.ContentDocumentId)
        allNoteIds[r.ContentDocumentId] = true
      }
    }

    const notesById: Record<string, any> = {}
    for (const chunk of chunkArray(Object.keys(allNoteIds), NOTE_CHUNK)) {
      if (!chunk.length) continue
      const ids = chunk.map(id => `'${id}'`).join(',')
      try {
        const nr = await sfQuery(session, `SELECT Id, Title, TextPreview, CreatedDate FROM ContentNote WHERE Id IN (${ids})`)
        for (const n of nr.records || []) notesById[n.Id] = n
      } catch {}
    }

    // Process cases
    const byIngeniero: Record<string, any> = {}
    const byCliente: Record<string, any>   = {}
    const byGrupo: Record<string, any>     = {}
    const tiemposGlobal: number[] = []
    const rows: any[] = []

    for (const c of cases) {
      const nit      = safeValue(c.AccountNumber__c).trim()
      const nitInfo  = NIT_INFO[nit]
      const cliente  = nitInfo?.nombre ?? (c.Account?.Name ?? nit ?? 'Sin cliente')
      const ingeniero = safeValue(c.LTE_ModeloComercial__c).trim() || 'Sin asignar'
      const categoria = safeValue(c.DEG_Categoria__c).trim()
      const grupoRaw  = c.Grupo_Aseguramiento__r?.Name
        ? String(c.Grupo_Aseguramiento__r.Name).trim().split(/[_\s]/)[0]
        : safeValue(c.Grupo_Aseguramiento__c).trim()
      const tipoEstado = c.IsClosed ? 'cerrado' : 'abierto'
      const fechaEnvioVal = safeValue(c.Fecha_Envio_Sistema_Legado__c).trim()

      const caseNotes = (noteIdsByCase[c.Id] || [])
        .map(id => notesById[id]).filter(Boolean)
        .sort((a: any, b: any) => new Date(a.CreatedDate).getTime() - new Date(b.CreatedDate).getTime())

      // Determine grupo receptor
      let grupoReceptor: string
      if (!fechaEnvioVal) {
        grupoReceptor = 'HDP'
      } else {
        grupoReceptor = normalizarGrupo(grupoRaw) ?? ''
        if (!grupoReceptor && caseNotes.length) {
          const idLeg = safeValue(c.Id_Sistema_Legado__c).trim()
          if (idLeg) {
            for (const n of caseNotes) {
              const gd = normalizarGrupo(safeValue(n.Title))
              if (gd && gd !== 'HDP') { grupoReceptor = gd; break }
              if (gd === 'HDP') grupoReceptor = 'HDP'
            }
          } else {
            grupoReceptor = normalizarGrupo(safeValue(caseNotes[0].Title)) ?? ''
          }
        }
        if (!grupoReceptor) grupoReceptor = 'HDP'
      }

      // Escalado time
      let minEscalado: number | null = null
      let escalado = false
      let colorEsc = 'sin_escalar'
      if (c.CreatedDate && fechaEnvioVal) {
        const diff = (new Date(fechaEnvioVal).getTime() - new Date(c.CreatedDate).getTime()) / 60000
        if (diff >= 0 && diff < 43200) {
          minEscalado = +diff.toFixed(2)
          escalado = true
          colorEsc = minEscalado < ESC_VERDE ? 'verde' : minEscalado < ESC_AMARILLO ? 'amarillo' : 'rojo'
        }
      }

      // Post-escalado metrics
      let minPrimerComentario: number | null = null
      let frecuenciaNotas: number | null = null
      let notasHDPPost = 0, notasRemedyPost = 0

      if (escalado && caseNotes.length) {
        const fechaEnvio = new Date(fechaEnvioVal)
        const notasPost = caseNotes.filter((n: any) => new Date(n.CreatedDate) >= fechaEnvio)

        for (const n of notasPost) {
          if (esHDP(safeValue(n.Title), safeValue(n.TextPreview))) notasHDPPost++
          else notasRemedyPost++
        }

        for (const n of notasPost) {
          if (!esHDP(safeValue(n.Title), safeValue(n.TextPreview))) {
            const dp = (new Date(n.CreatedDate).getTime() - fechaEnvio.getTime()) / 60000
            if (dp >= 0) { minPrimerComentario = +dp.toFixed(2); break }
          }
        }

        if (notasPost.length >= 2) {
          let totalMs = 0
          for (let i = 1; i < notasPost.length; i++)
            totalMs += new Date(notasPost[i].CreatedDate).getTime() - new Date(notasPost[i-1].CreatedDate).getTime()
          frecuenciaNotas = +(totalMs / (notasPost.length - 1) / 3600000).toFixed(2)
        }
      }

      // Accumulate
      if (escalado) {
        tiemposGlobal.push(minEscalado!)
        if (!byIngeniero[ingeniero]) byIngeniero[ingeniero] = { tiempos:[], verde:0, amarillo:0, rojo:0 }
        byIngeniero[ingeniero].tiempos.push(minEscalado!)
        byIngeniero[ingeniero][colorEsc]++
        const ck = nit || cliente
        if (!byCliente[ck]) byCliente[ck] = { nit, nombre:cliente, tiempos:[], verde:0, amarillo:0, rojo:0, ab:0, cer:0 }
        byCliente[ck].tiempos.push(minEscalado!)
        byCliente[ck][colorEsc]++
        if (tipoEstado === 'abierto') byCliente[ck].ab++; else byCliente[ck].cer++
      }

      if (grupoReceptor) {
        if (!byGrupo[grupoReceptor]) byGrupo[grupoReceptor] = { minsPrim:[], freqs:[], casos:0, conResp:0, totalNotasPost:0, totalNotasHDP:0, totalNotasRemedy:0 }
        byGrupo[grupoReceptor].casos++
        byGrupo[grupoReceptor].totalNotasPost  += (notasHDPPost + notasRemedyPost)
        byGrupo[grupoReceptor].totalNotasHDP   += notasHDPPost
        byGrupo[grupoReceptor].totalNotasRemedy += notasRemedyPost
        const t = grupoReceptor === 'HDP' ? minEscalado : minPrimerComentario
        if (t !== null) { byGrupo[grupoReceptor].minsPrim.push(t); byGrupo[grupoReceptor].conResp++ }
        if (frecuenciaNotas !== null) byGrupo[grupoReceptor].freqs.push(frecuenciaNotas)
      }

      const timeline = caseNotes.map((n: any) => ({
        titulo:   safeValue(n.Title),
        preview:  safeValue(n.TextPreview || ''),
        grupo:    normalizarGrupo(safeValue(n.Title)) ?? 'Sin grupo',
        fecha:    n.CreatedDate,
        fechaFmt: fmtLocal(n.CreatedDate),
      }))

      rows.push({
        caseId: c.Id, caseNumber: c.CaseNumber || '', subject: safeValue(c.Subject),
        status: safeValue(c.Status), tipoEstado, nit, cliente, ingeniero, categoria,
        grupoReceptor,
        createdDate: c.CreatedDate || '', createdDateFmt: fmtLocal(c.CreatedDate),
        closedDate: c.ClosedDate || '', closedDateFmt: c.ClosedDate ? fmtLocal(c.ClosedDate) : '',
        fechaEnvio: fechaEnvioVal, fechaEnvioFmt: fechaEnvioVal ? fmtLocal(fechaEnvioVal) : 'No escalado',
        idLegado: safeValue(c.Id_Sistema_Legado__c),
        escalado, minEscalado, colorEsc, minPrimerComentario, frecuenciaNotas,
        totalNotas: caseNotes.length, notasHDPPost, notasRemedyPost,
        timeline,
      })
    }

    const statsEscHDP = calcularStats(tiemposGlobal)

    const ingenieroStats = Object.entries(byIngeniero).map(([nombre, d]: any) => {
      const s = calcularStats(d.tiempos), tot = d.tiempos.length
      return { nombre, total:tot, verde:d.verde, amarillo:d.amarillo, rojo:d.rojo,
        pctVerde: tot > 0 ? +(d.verde/tot*100).toFixed(1) : 0,
        media:s.media, mediana:s.mediana, p75:s.p75, p90:s.p90 }
    }).sort((a, b) => b.total - a.total)

    const clienteStats = Object.entries(byCliente).map(([, d]: any) => {
      const s = calcularStats(d.tiempos)
      return { nit:d.nit, nombre:d.nombre, total:d.tiempos.length, totalAb:d.ab, totalCer:d.cer,
        verde:d.verde, amarillo:d.amarillo, rojo:d.rojo, media:s.media, mediana:s.mediana, p90:s.p90 }
    }).sort((a, b) => b.total - a.total)

    const grupoStats = Object.entries(byGrupo).map(([grupo, d]: any) => {
      const sp = calcularStats(d.minsPrim), sf = calcularStats(d.freqs)
      return { grupo, casos:d.casos, conResp:d.conResp,
        mediaPrim: grupo === 'HDP' ? statsEscHDP.media : sp.media,
        medianaPrim: grupo === 'HDP' ? statsEscHDP.mediana : sp.mediana,
        p90Prim: grupo === 'HDP' ? statsEscHDP.p90 : sp.p90,
        mediaEscalado: grupo === 'HDP' ? statsEscHDP.media : null,
        medianaEscalado: grupo === 'HDP' ? statsEscHDP.mediana : null,
        mediaFreq: sf.media,
        promNotasPorCaso: d.casos > 0 ? +(d.totalNotasPost/d.casos).toFixed(1) : 0,
        promHDPPorCaso:   d.casos > 0 ? +(d.totalNotasHDP/d.casos).toFixed(1) : 0,
        promRemedyPorCaso:d.casos > 0 ? +(d.totalNotasRemedy/d.casos).toFixed(1) : 0,
      }
    }).sort((a, b) => b.casos - a.casos)

    const summary = {
      total:     rows.length,
      abiertos:  rows.filter(r => r.tipoEstado === 'abierto').length,
      cerrados:  rows.filter(r => r.tipoEstado === 'cerrado').length,
      escalados: rows.filter(r => r.escalado).length,
      sinEscalar:rows.filter(r => !r.escalado).length,
      verde:     rows.filter(r => r.colorEsc === 'verde').length,
      amarillo:  rows.filter(r => r.colorEsc === 'amarillo').length,
      rojo:      rows.filter(r => r.colorEsc === 'rojo').length,
    }

    return NextResponse.json({
      ok: true,
      updatedAt: fmtLocal(new Date()),
      periodoDesde: primerDia,
      summary, statsGlobal: statsEscHDP,
      rows, ingenieroStats, clienteStats: clienteStats.slice(0, 50),
      grupoStats, thresholds: { verde: ESC_VERDE, amarillo: ESC_AMARILLO },
    })
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 })
  }
}
