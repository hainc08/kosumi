import { IconEdit } from '@tabler/icons-react'
import {
  CUSTOMER_TYPE_LABELS, PAYMENT_TERMS_LABELS,
  type Customer, type PaymentTermsPreset,
} from '@/types'
import { formatCurrency } from '@/utils/format'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import './CustomerDetailDrawer.css'

interface Props { customer: Customer | null; open: boolean; onClose: () => void; onEdit: (c: Customer) => void }

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="cd-row"><span className="cd-row__label">{label}</span><span className="cd-row__value">{value || '—'}</span></div>
}

export function CustomerDetailDrawer({ customer, open, onClose, onEdit }: Props) {
  if (!customer) return null
  const terms = PAYMENT_TERMS_LABELS[customer.defaultPaymentTerms as PaymentTermsPreset] ?? customer.defaultPaymentTerms

  return (
    <DetailDrawer
      open={open} onClose={onClose} title="Chi tiết khách hàng"
      actions={<Button variant="primary" icon={<IconEdit size={15} />} onClick={() => onEdit(customer)}>Chỉnh sửa</Button>}
    >
      <div className="cd-head">
        <div>
          <div className="cd-name">{customer.name}</div>
          <div className="cd-code">{customer.code} · {CUSTOMER_TYPE_LABELS[customer.type]}</div>
        </div>
        {customer.industry && <Badge variant="blue">{customer.industry}</Badge>}
      </div>

      <div className="cd-stats">
        <div><span className="cd-stats__v">{customer.projectCount ?? 0}</span><span className="cd-stats__l">Dự án</span></div>
        <div><span className="cd-stats__v">{customer.quoteCount ?? 0}</span><span className="cd-stats__l">Báo giá</span></div>
        <div><span className="cd-stats__v">{formatCurrency(customer.totalContractValue ?? 0)}</span><span className="cd-stats__l">Tổng giá trị</span></div>
      </div>

      <div className="cd-section">Thông tin chung</div>
      <Row label="Mã số thuế" value={customer.taxCode} />
      <Row label="Website" value={customer.website} />
      <Row label="Địa chỉ" value={customer.address} />
      {customer.notes && <Row label="Ghi chú" value={customer.notes} />}

      <div className="cd-section">Người liên hệ ({customer.contacts?.length ?? 0})</div>
      {(customer.contacts ?? []).map((ct) => (
        <div key={ct.id} className="cd-contact">
          <div className="cd-contact__top">
            <span className="cd-contact__name">{ct.fullName}</span>
            {ct.isPrimary && <span className="cd-contact__primary">Chính</span>}
          </div>
          <div className="cd-contact__meta">
            {ct.title && <span>{ct.title}</span>}
            {ct.phone && <span>📞 {ct.phone}</span>}
            {ct.email && <span>✉ {ct.email}</span>}
          </div>
        </div>
      ))}

      <div className="cd-section">Điều khoản mặc định</div>
      <Row label="Hiệu lực báo giá" value={`${customer.defaultValidityDays} ngày`} />
      <Row label="Thời gian giao hàng" value={`${customer.defaultDeliveryDays} ngày`} />
      <Row label="Thanh toán" value={terms} />
      {customer.defaultWarrantyNote && <Row label="Bảo hành" value={customer.defaultWarrantyNote} />}
      {customer.defaultSpecialNote && <Row label="Ghi chú đặc biệt" value={customer.defaultSpecialNote} />}

      <p className="cd-note">Lịch sử dự án & báo giá sẽ hiển thị khi các module đó hoàn thành.</p>
    </DetailDrawer>
  )
}
