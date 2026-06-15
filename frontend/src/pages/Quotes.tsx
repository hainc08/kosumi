import { useMemo, useState } from 'react'
import { 
  IconFileInvoice, IconCircleCheck, IconClock, IconCurrencyDollar, IconPlus,
  IconSend, IconCopy, IconEdit, IconTrash, IconCheck, IconX, IconEye, IconPrinter
} from '@tabler/icons-react'
import { QUOTE_STATUS_LABELS, type Quote, type QuoteStatus } from '@/types'
import { useQuotes, useUpdateQuoteStatus, useDuplicateQuote } from '@/api/quotes'
import { useProjects } from '@/api/projects'
import { formatCurrency, formatDate } from '@/utils/format'
import { PageShell } from '@/components/layout/PageShell'
import { KpiCard } from '@/components/ui/KpiCard'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { SearchBox } from '@/components/ui/SearchBox'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { QuoteForm } from '@/components/quotes/QuoteForm'
import { QuoteDetailDrawer, QUOTE_STATUS_VARIANT } from '@/components/quotes/QuoteDetailDrawer'
import { useToastStore } from '@/stores/toastStore'
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

  const updateStatus = useUpdateQuoteStatus()
  const duplicateQuote = useDuplicateQuote()
  const toast = useToastStore(s => s.show)

  const kpis = useMemo(() => {
    const total = all.length
    const approved = all.filter(q => q.status === 'approved' || q.status === 'po_received').length
    const pending = all.filter(q => q.status === 'pending').length
    const totalValue = all
      .filter(q => q.status === 'approved' || q.status === 'po_received')
      .reduce((sum, q) => sum + (q.totalAmount || 0), 0)
    
    return { total, approved, pending, totalValue }
  }, [all])

  const handleStatusChange = async (e: React.MouseEvent, id: string, newStatus: QuoteStatus) => {
    e.stopPropagation()
    await updateStatus.mutateAsync({ id, status: newStatus })
    toast(`✓ Đã cập nhật trạng thái: ${QUOTE_STATUS_LABELS[newStatus]}`)
  }

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    await duplicateQuote.mutateAsync(id)
    toast('✓ Đã nhân bản báo giá')
  }

  const columns: Column<Quote>[] = [
    { key: 'code', header: 'Số báo giá', render: (q) => <span className="td-main" style={{ color: 'var(--blue)' }}>{q.code}</span> },
    { key: 'title', header: 'Đầu mục', render: (q) => q.title },
    { key: 'project', header: 'Dự án', render: (q) => q.project?.name || q.customer?.name || '—' },
    { key: 'itemCount', header: 'Hạng mục', render: (q) => `${q.itemCount || 0} hạng mục` },
    { key: 'quoteDate', header: 'Ngày tạo', render: (q) => formatDate(q.quoteDate) },
    { key: 'totalAmount', header: 'Giá trị', render: (q) => <span style={{ fontWeight: 600 }}>{formatCurrency(q.totalAmount || 0)}</span> },
    { key: 'status', header: 'Trạng thái', render: (q) => <Badge variant={QUOTE_STATUS_VARIANT[q.status]} dot>{QUOTE_STATUS_LABELS[q.status]}</Badge> },
    {
      key: 'actions', header: '', width: '180px',
      render: (q) => (
        <div className="td-actions">
          {q.status === 'draft' && <div className="act-btn" title="Gửi duyệt" style={{ color: 'var(--amber)' }} onClick={(e) => handleStatusChange(e, q.id, 'pending')}><IconSend size={13} /></div>}
          {q.status === 'pending' && <div className="act-btn" title="Phê duyệt" style={{ color: 'var(--green)' }} onClick={(e) => handleStatusChange(e, q.id, 'approved')}><IconCheck size={13} /></div>}
          {q.status === 'pending' && <div className="act-btn" title="Không duyệt" style={{ color: 'var(--red)' }} onClick={(e) => handleStatusChange(e, q.id, 'rejected')}><IconX size={13} /></div>}
          
          <div className="act-btn" title="Nhân bản (Clone)" style={{ color: 'var(--purple)' }} onClick={(e) => handleDuplicate(e, q.id)}><IconCopy size={13} /></div>
          
          {['draft', 'rejected'].includes(q.status) && <div className="act-btn" title="Sửa" onClick={(e) => openEdit(e, q)}><IconEdit size={13} /></div>}
          {['draft', 'rejected'].includes(q.status) && <div className="act-btn del" title="Xóa" onClick={(e) => e.stopPropagation()}><IconTrash size={13} /></div>}

          <div className="act-btn" title="Chi tiết" onClick={(e) => { e.stopPropagation(); setSelected(q) }}><IconEye size={13} /></div>
          <div className="act-btn" title="Xem trước" style={{ color: 'var(--blue)' }} onClick={(e) => openPreview(e, q)}><IconPrinter size={13} /></div>
        </div>
      )
    }
  ]

  const openAdd = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (e: React.MouseEvent, q: Quote) => { e.stopPropagation(); setSelected(null); setEditing(q); setFormOpen(true) }
  const openPreview = (e: React.MouseEvent, q: Quote) => { e.stopPropagation(); window.open(`/quotes/${q.id}/preview`, '_blank') }

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
        onPreview={(q) => window.open(`/quotes/${q.id}/preview`, '_blank')} 
      />
    </PageShell>
  )
}
