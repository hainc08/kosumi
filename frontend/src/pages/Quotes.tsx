import { useMemo, useState } from 'react'
import {
  IconFileInvoice, IconCircleCheck, IconClock, IconCurrencyDollar, IconPlus,
  IconEye, IconPrinter, IconCopy, IconEdit, IconSend, IconCheck, IconX,
} from '@tabler/icons-react'
import { QUOTE_STATUS_LABELS, type Quote, type QuoteStatus } from '@/types'
import { useQuotes, useUpdateQuoteStatus, useDuplicateQuote } from '@/api/quotes'
import { useProjects } from '@/api/projects'
import { useToastStore } from '@/stores/toastStore'
import { formatCurrency, formatDate } from '@/utils/format'
import { PageShell } from '@/components/layout/PageShell'
import { KpiCard } from '@/components/ui/KpiCard'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { SearchBox } from '@/components/ui/SearchBox'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { FormModal } from '@/components/ui/FormModal'
import { FormField } from '@/components/ui/FormField'
import { QuoteForm } from '@/components/quotes/QuoteForm'
import { QuoteDetailDrawer, QUOTE_STATUS_VARIANT } from '@/components/quotes/QuoteDetailDrawer'
import './Quotes.css'

export default function QuotesPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [projectId, setProjectId] = useState('')

  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Quote | null>(null)
  const [selected, setSelected] = useState<Quote | null>(null)

  const [rejectTarget, setRejectTarget] = useState<Quote | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const { data: projects = [] } = useProjects()
  const { data: all = [] } = useQuotes({})
  const { data: quotes = [], isLoading } = useQuotes({ search, status, projectId })

  const updateStatus = useUpdateQuoteStatus()
  const duplicateQuote = useDuplicateQuote()
  const toast = useToastStore((s) => s.show)

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
  const openEdit = (q: Quote) => { setSelected(null); setEditing(q); setFormOpen(true) }
  const openPreview = (q: Quote) => window.open(`/quotes/${q.id}/preview`, '_blank')

  const handleStatus = async (q: Quote, next: QuoteStatus, reason?: string) => {
    await updateStatus.mutateAsync({ id: q.id, status: next, rejectReason: reason })
    toast(`✓ Đã chuyển trạng thái: ${QUOTE_STATUS_LABELS[next]}`)
  }
  const handleDuplicate = async (q: Quote) => {
    await duplicateQuote.mutateAsync(q.id)
    toast('✓ Đã nhân bản báo giá')
  }
  const confirmReject = async () => {
    if (!rejectTarget) return
    await handleStatus(rejectTarget, 'rejected', rejectReason)
    setRejectTarget(null); setRejectReason('')
  }

  // Nút hành động theo trạng thái (khớp workshop_pro.html) — chặn nổi bọt để không mở drawer.
  const ActBtn = ({ title, color, onClick, children }: {
    title: string; color?: string; onClick: () => void; children: React.ReactNode
  }) => (
    <div className="act-btn" title={title} style={color ? { color } : undefined}
      onClick={(e) => { e.stopPropagation(); onClick() }}>
      {children}
    </div>
  )

  const renderActions = (q: Quote) => {
    const canEdit = q.status === 'draft' || q.status === 'rejected'
    return (
      <div className="td-actions">
        {q.status === 'draft' && (
          <ActBtn title="Gửi duyệt" color="var(--amber)" onClick={() => handleStatus(q, 'pending')}><IconSend size={13} /></ActBtn>
        )}
        {q.status === 'pending' && (
          <>
            <ActBtn title="Phê duyệt" color="var(--green)" onClick={() => handleStatus(q, 'approved')}><IconCheck size={13} /></ActBtn>
            <ActBtn title="Từ chối" color="var(--red)" onClick={() => { setRejectReason(''); setRejectTarget(q) }}><IconX size={13} /></ActBtn>
          </>
        )}
        <ActBtn title="Nhân bản" color="var(--purple)" onClick={() => handleDuplicate(q)}><IconCopy size={13} /></ActBtn>
        {canEdit && (
          <ActBtn title="Sửa" onClick={() => openEdit(q)}><IconEdit size={13} /></ActBtn>
        )}
        <ActBtn title="Chi tiết" onClick={() => setSelected(q)}><IconEye size={13} /></ActBtn>
        <ActBtn title="Xem trước" color="var(--blue)" onClick={() => openPreview(q)}><IconPrinter size={13} /></ActBtn>
      </div>
    )
  }

  const columns: Column<Quote>[] = [
    { key: 'code', header: 'Số báo giá', width: '110px', render: (q) => <span className="cell-quote__num">{q.code}</span> },
    { key: 'title', header: 'Đầu mục', render: (q) => <span className="td-main">{q.title}</span> },
    { key: 'project', header: 'Dự án', render: (q) => q.project?.name ?? '—' },
    { key: 'items', header: 'Hạng mục', align: 'center', render: (q) => `${q.itemCount ?? q.items?.length ?? 0} hạng mục` },
    { key: 'date', header: 'Ngày tạo', render: (q) => formatDate(q.quoteDate) },
    { key: 'value', header: 'Giá trị', align: 'right', render: (q) => formatCurrency(q.totalAmount ?? 0) },
    { key: 'status', header: 'Trạng thái', render: (q) => <Badge variant={QUOTE_STATUS_VARIANT[q.status]} dot>{QUOTE_STATUS_LABELS[q.status]}</Badge> },
    { key: 'actions', header: '', align: 'right', render: renderActions },
  ]

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
        <SearchBox value={search} onChange={setSearch} placeholder="Tìm số BG, đầu mục..." width="260px" />
        <FilterSelect value={status} onChange={setStatus} placeholder="Tất cả trạng thái"
          options={(Object.keys(QUOTE_STATUS_LABELS) as QuoteStatus[]).map((k) => ({ value: k, label: QUOTE_STATUS_LABELS[k] }))} />
        <FilterSelect value={projectId} onChange={setProjectId} placeholder="Tất cả dự án"
          options={projects.map((p) => ({ value: p.id, label: p.name }))} />
      </div>

      <DataTable
        columns={columns} data={quotes} loading={isLoading} rowKey={(q) => q.id}
        onRowClick={(q) => setSelected(q)} emptyText="Không tìm thấy báo giá nào"
      />

      <QuoteForm open={formOpen} quote={editing} onClose={() => setFormOpen(false)} />
      <QuoteDetailDrawer
        quote={selected}
        open={!!selected}
        onClose={() => setSelected(null)}
        onEdit={(q) => { setSelected(null); setEditing(q); setFormOpen(true) }}
        onPreview={openPreview}
      />

      <FormModal
        open={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        title="Từ chối báo giá"
        footer={
          <>
            <Button onClick={() => setRejectTarget(null)}>Hủy</Button>
            <Button variant="primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }}
              onClick={confirmReject} disabled={!rejectReason.trim()}
            >
              Xác nhận từ chối
            </Button>
          </>
        }
      >
        <FormField label="Lý do từ chối" required>
          <textarea rows={3} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Nhập lý do chi tiết..." />
        </FormField>
      </FormModal>
    </PageShell>
  )
}
