import { useMemo, useState } from 'react'
import {
  IconFileInvoice, IconCircleCheck, IconClock, IconCurrencyDollar, IconPlus,
} from '@tabler/icons-react'
import { QUOTE_STATUS_LABELS, type Quote, type QuoteStatus } from '@/types'
import { useQuotes } from '@/api/quotes'
import { useProjects } from '@/api/projects'
import { formatCurrency } from '@/utils/format'
import { PageShell } from '@/components/layout/PageShell'
import { KpiCard } from '@/components/ui/KpiCard'
import { SearchBox } from '@/components/ui/SearchBox'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { QuoteForm } from '@/components/quotes/QuoteForm'
import { QuoteDetailDrawer, QUOTE_STATUS_VARIANT } from '@/components/quotes/QuoteDetailDrawer'
import { groupQuotes } from '@/components/quotes/groupQuotes'
import './Quotes.css'

export default function QuotesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [projectId, setProjectId] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Quote | null>(null)
  const [selected, setSelected] = useState<Quote | null>(null)

  const { data: projects = [] } = useProjects()
  const { data: all = [] } = useQuotes({})
  const { data: quotes = [], isLoading } = useQuotes({ search, status, projectId })

  const groups = useMemo(() => groupQuotes(quotes), [quotes])

  const kpis = useMemo(() => {
    const total = all.length
    const approved = all.filter(q => q.status === 'approved' || q.status === 'po_received').length
    const pending = all.filter(q => q.status === 'pending').length
    const totalValue = all
      .filter(q => q.status === 'approved' || q.status === 'po_received')
      .reduce((sum, q) => sum + (q.totalAmount || 0), 0)

    return { total, approved, pending, totalValue }
  }, [all])

  const openAdd = () => { setEditing(null); setFormOpen(true) }

  return (
    <PageShell
      title="Báo giá" subtitle="Quản lý và phê duyệt"
      actions={<Button variant="primary" icon={<IconPlus size={15} />} onClick={openAdd}>Tạo báo giá</Button>}
    >
      <div className="kpi-row">
        <KpiCard label="Tổng báo giá" value={kpis.total} icon={<IconFileInvoice size={16} />} iconColor="var(--color-blue)" />
        <KpiCard label="Đã duyệt / Có PO" value={kpis.approved} icon={<IconCircleCheck size={16} />} iconColor="var(--color-green)" />
        <KpiCard label="Chờ phê duyệt" value={kpis.pending} icon={<IconClock size={16} />} iconColor="var(--color-amber)" />
        <KpiCard label="Tổng giá trị (Đã duyệt)" value={formatCurrency(kpis.totalValue)} icon={<IconCurrencyDollar size={16} />} iconColor="var(--color-purple)" />
      </div>

      <div className="toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Tìm đầu mục, số BG..." width="260px" />
        <FilterSelect value={status} onChange={setStatus} placeholder="Tất cả trạng thái"
          options={(Object.keys(QUOTE_STATUS_LABELS) as QuoteStatus[]).map((k) => ({ value: k, label: QUOTE_STATUS_LABELS[k] }))} />
        <FilterSelect value={projectId} onChange={setProjectId} placeholder="Tất cả dự án"
          options={projects.map((p) => ({ value: p.id, label: p.name }))} />
      </div>

      {isLoading ? (
        <div className="dash-empty">Đang tải…</div>
      ) : groups.length === 0 ? (
        <div className="dash-empty">Không tìm thấy báo giá nào</div>
      ) : (
        <div className="q-groups">
          {groups.map((g) => (
            <div key={g.projectId} className="q-group">
              <div className="q-group__head">
                <span className="q-group__name">{g.projectName}</span>
                {g.hasInstallation && (
                  <Badge variant="blue">Có lắp đặt</Badge>
                )}
                <span className="q-group__meta">{g.quoteCount} báo giá</span>
              </div>
              {g.sections.map((sec) => (
                <div key={sec.sectionName} className="q-sec">
                  <div className="q-sec__name">{sec.sectionName}</div>
                  <table className="q-itable">
                    <tbody>
                      {sec.items.map((it, idx) => {
                        const q = quotes.find((x) => x.id === it.quoteId)!
                        return (
                          <tr key={it.quoteId + idx} onClick={() => setSelected(q)} className="q-irow">
                            <td className="q-irow__name">{it.itemName}</td>
                            <td>{it.quantity} {it.unit}</td>
                            <td>{formatCurrency(it.unitPrice)}</td>
                            <td className="q-irow__amt">{formatCurrency(it.amount)}</td>
                            <td><span style={{ color: 'var(--blue)' }}>{it.quoteCode}</span></td>
                            <td><Badge variant={QUOTE_STATUS_VARIANT[it.status as QuoteStatus]} dot>{QUOTE_STATUS_LABELS[it.status as QuoteStatus]}</Badge></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      <QuoteForm open={formOpen} quote={editing} onClose={() => setFormOpen(false)} />
      <QuoteDetailDrawer
        quote={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onEdit={(q) => { setSelected(null); setEditing(q); setFormOpen(true) }}
        onPreview={(q) => window.open(`/quotes/${q.id}/preview`, '_blank')}
      />
    </PageShell>
  )
}
