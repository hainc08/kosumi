import type { Quote } from '@/types'

export interface QuoteItemRow {
  quoteId: string; quoteCode: string; status: string
  itemName: string; unit: string; quantity: number; unitPrice: number; amount: number
}
export interface SectionGroup { sectionName: string; items: QuoteItemRow[] }
export interface ProjectGroup {
  projectId: string; projectName: string; hasInstallation: boolean
  quoteCount: number; sections: SectionGroup[]
}

export function groupQuotes(quotes: Quote[]): ProjectGroup[] {
  const byProject = new Map<string, ProjectGroup>()
  const sectionMap = new Map<string, Map<string, SectionGroup>>() // projectId -> sectionName -> group
  const quoteIds = new Map<string, Set<string>>() // projectId -> set of quote ids

  for (const q of quotes) {
    const pid = q.projectId || '—'
    if (!byProject.has(pid)) {
      byProject.set(pid, { projectId: pid, projectName: q.project?.name ?? 'Chưa gắn dự án', hasInstallation: false, quoteCount: 0, sections: [] })
      sectionMap.set(pid, new Map())
      quoteIds.set(pid, new Set())
    }
    const group = byProject.get(pid)!
    if (q.hasInstallation) group.hasInstallation = true
    quoteIds.get(pid)!.add(q.id)

    for (const it of q.items ?? []) {
      const sname = it.sectionName?.trim() || 'Khác'
      const secs = sectionMap.get(pid)!
      if (!secs.has(sname)) {
        const sg: SectionGroup = { sectionName: sname, items: [] }
        secs.set(sname, sg)
        group.sections.push(sg)
      }
      secs.get(sname)!.items.push({
        quoteId: q.id, quoteCode: q.code, status: q.status,
        itemName: it.itemName, unit: it.unit, quantity: it.quantity, unitPrice: it.unitPrice, amount: it.amount,
      })
    }
  }

  for (const [pid, group] of byProject) group.quoteCount = quoteIds.get(pid)!.size
  return [...byProject.values()].sort((a, b) => a.projectName.localeCompare(b.projectName, 'vi'))
}
