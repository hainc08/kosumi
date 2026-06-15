import { useState } from 'react'
import { IconEdit, IconCheck, IconX, IconCopy, IconPrinter } from '@tabler/icons-react'
import { QUOTE_STATUS_LABELS, type Quote, type QuoteStatus } from '@/types'
import { formatCurrency, formatDate } from '@/utils/format'
import { useUpdateQuoteStatus, useDuplicateQuote } from '@/api/quotes'
import { useToastStore } from '@/stores/toastStore'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { FormModal } from '@/components/ui/FormModal'
import { FormField } from '@/components/ui/FormField'
import './QuoteDetailDrawer.css'

export const QUOTE_STATUS_VARIANT: Record<QuoteStatus, BadgeVariant> = {
  draft: 'gray', pending: 'amber', approved: 'green',
  rejected: 'red', po_received: 'purple',
}

interface Props { 
  quote: Quote | null; 
  open: boolean; 
  onClose: () => void; 
  onEdit: (q: Quote) => void;
  onPreview: (q: Quote) => void;
}

function Row({ label, value, colSpan = false }: { label: string; value: React.ReactNode; colSpan?: boolean }) {
  return (
    <div className={`qd-row ${colSpan ? 'qd-row--colspan' : ''}`}>
      <span className="qd-row__label">{label}</span>
      <span className="qd-row__value">{value || '—'}</span>
    </div>
  )
}

export function QuoteDetailDrawer({ quote, open, onClose, onEdit, onPreview }: Props) {
  const [rejectModalOpen, setRejectModalOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  
  const updateStatus = useUpdateQuoteStatus()
  const duplicateQuote = useDuplicateQuote()
  const toast = useToastStore(s => s.show)

  if (!quote) return null

  const handleStatusChange = async (status: QuoteStatus, reason?: string) => {
    await updateStatus.mutateAsync({ id: quote.id, status, rejectReason: reason })
    toast(`✓ Đã chuyển trạng thái thành: ${QUOTE_STATUS_LABELS[status]}`)
    if (status === 'rejected') setRejectModalOpen(false)
  }

  const handleDuplicate = async () => {
    await duplicateQuote.mutateAsync(quote.id)
    toast('✓ Đã nhân bản báo giá')
    onClose()
  }

  const actions = (
    <div style={{ display: 'flex', gap: '8px' }}>
      <Button icon={<IconPrinter size={15} />} onClick={() => onPreview(quote)}>In</Button>
      <Button icon={<IconCopy size={15} />} onClick={handleDuplicate}>Nhân bản</Button>
      {['draft', 'rejected'].includes(quote.status) && (
        <Button variant="primary" icon={<IconEdit size={15} />} onClick={() => onEdit(quote)}>Sửa</Button>
      )}
    </div>
  )

  return (
    <>
      <DetailDrawer open={open} onClose={onClose} title="Chi tiết báo giá" actions={actions}>
        <div className="qd-head">
          <div>
            <div className="qd-title">{quote.title}</div>
            <div className="qd-code">{quote.code}</div>
          </div>
          <Badge variant={QUOTE_STATUS_VARIANT[quote.status]} dot>{QUOTE_STATUS_LABELS[quote.status]}</Badge>
        </div>

        {/* Action bar cho status */}
        {quote.status === 'draft' && (
          <div className="qd-action-bar">
            <span>Báo giá đang ở trạng thái Nháp.</span>
            <Button size="sm" variant="primary" onClick={() => handleStatusChange('pending')}>Gửi duyệt</Button>
          </div>
        )}
        {quote.status === 'pending' && (
          <div className="qd-action-bar qd-action-bar--pending">
            <span>Đang chờ phê duyệt.</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button size="sm" onClick={() => setRejectModalOpen(true)} icon={<IconX size={14} />}>Từ chối</Button>
              <Button size="sm" variant="primary" onClick={() => handleStatusChange('approved')} icon={<IconCheck size={14} />}>Phê duyệt</Button>
            </div>
          </div>
        )}
        {quote.status === 'rejected' && quote.rejectReason && (
          <div className="qd-alert qd-alert--error">
            <strong>Lý do từ chối:</strong> {quote.rejectReason}
          </div>
        )}

        <div className="qd-section">Thông tin chung</div>
        <div className="qd-grid">
          <Row label="Dự án" value={quote.project?.name} colSpan />
          <Row label="Khách hàng" value={quote.customer?.name} colSpan />
          <Row label="Ngày báo giá" value={formatDate(quote.quoteDate)} />
          <Row label="Hiệu lực đến" value={formatDate(quote.validUntil)} />
          <Row label="Giá trị trước thuế" value={formatCurrency(quote.subtotal || 0)} />
          <Row label={`Thuế VAT (${quote.taxRate}%)`} value={formatCurrency(quote.taxAmount || 0)} />
          <Row label="Tổng cộng" value={<strong>{formatCurrency(quote.totalAmount || 0)}</strong>} colSpan />
        </div>

        <div className="qd-section">Hạng mục ({quote.items?.length || 0})</div>
        <div className="qd-items">
          {quote.items?.map((item, i) => (
            <div key={item.id} className="qd-item">
              <div className="qd-item-head">
                <span className="qd-item-name">{i + 1}. {item.itemName}</span>
                <span className="qd-item-amount">{formatCurrency(item.amount)}</span>
              </div>
              <div className="qd-item-meta">
                {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
              </div>
              {item.description && <div className="qd-item-desc">{item.description}</div>}
            </div>
          ))}
        </div>

        <div className="qd-section">Thanh toán & Điều khoản</div>
        <div className="qd-grid">
          <Row label="Thời gian giao hàng" value={`${quote.deliveryDays} ngày`} />
          <Row label="Điều khoản thanh toán" value={quote.paymentTerms} />
        </div>
        
        {quote.paymentSteps && quote.paymentSteps.length > 0 && (
          <div className="qd-steps">
            {quote.paymentSteps.map(step => (
              <div key={step.id} className="qd-step">
                <Badge variant="blue">{step.percentage}%</Badge>
                <span className="qd-step-desc">{step.description}</span>
              </div>
            ))}
          </div>
        )}

        <div className="qd-grid" style={{ marginTop: '16px' }}>
          <Row label="Bảo hành" value={quote.warrantyNote} colSpan />
          <Row label="Nhà thầu phụ/CĐT cấp" value={quote.contractorNote} colSpan />
          <Row label="Ghi chú" value={quote.notes} colSpan />
        </div>
      </DetailDrawer>

      <FormModal 
        open={rejectModalOpen} 
        onClose={() => setRejectModalOpen(false)} 
        title="Từ chối báo giá" 
        footer={
          <>
            <Button onClick={() => setRejectModalOpen(false)}>Hủy</Button>
            <Button variant="primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }} 
              onClick={() => handleStatusChange('rejected', rejectReason)}
              disabled={!rejectReason.trim()}
            >
              Xác nhận từ chối
            </Button>
          </>
        }
      >
        <FormField label="Lý do từ chối" required>
          <textarea rows={3} value={rejectReason} onChange={e => setRejectReason(e.target.value)} placeholder="Nhập lý do chi tiết..." />
        </FormField>
      </FormModal>
    </>
  )
}
