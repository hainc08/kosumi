import { useParams, useNavigate } from 'react-router-dom'
import {
  IconArrowLeft, IconPrinter, IconDownload, IconFileInvoice, IconBuildingFactory2,
  IconBuilding, IconHammer, IconMail, IconBuildingSkyscraper, IconList, IconCalendar,
  IconFileDescription, IconInfoCircle,
} from '@tabler/icons-react'
import { useQuote } from '@/api/quotes'
import { useCustomer } from '@/api/customers'
import { formatDate } from '@/utils/format'
import { Badge } from '@/components/ui/Badge'
import { QUOTE_STATUS_VARIANT } from '@/components/quotes/QuoteDetailDrawer'
import { QUOTE_STATUS_LABELS, type QuoteItem } from '@/types'
import './QuotePreview.css'

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
const money = (n: number) => new Intl.NumberFormat('vi-VN').format(Math.round(n))

const KOSUMI = {
  name: 'CÔNG TY CỔ PHẦN KOSUMI',
  tagline: 'KOSUMI JOINT STOCK COMPANY',
  info: [
    'Metal Work · Laser Cutting · Steel Structures · Casting',
    'VP: Lô A, KCN Thăng Long, Đông Anh, Hà Nội',
    'Xưởng: Cụm CN Tân An, TP. Hải Phòng',
    'Tel: 0865 039 882  |  Email: info@kosumi.vn  |  kosumi.vn',
  ],
  partyAddr: ['Lô A, KCN Thăng Long', 'Đông Anh, TP. Hà Nội'],
  email: 'info@kosumi.vn',
  sender: 'Mai Tiến Dũng',
  senderPhone: '0983 375 892',
  rep: 'HÀ ANH MINH',
  repRole: 'Tổng Giám đốc — KOSUMI JSC',
}

const PROVIDED = [
  'Không gian & giấy phép làm việc / Working permit & space',
  'Giàn giáo, ánh sáng, nguồn điện, nước thi công / Scaffolding, lighting, electricity, water',
  'Không gian đặt văn phòng, nhà kho, khu chế tạo / Site office, warehouse, fabrication area',
  'Khu tập kết rác, phế liệu / Garbage & debris collection point',
  'Mọi phát sinh ngoài hợp đồng phải có đơn đặt hàng trước khi triển khai',
]

interface SectionGroup { name: string; nameEn?: string; items: QuoteItem[]; sum: number }

function groupBySection(items: QuoteItem[]): SectionGroup[] {
  const groups: SectionGroup[] = []
  const index = new Map<string, number>()
  for (const it of items) {
    const key = it.sectionName ?? '__none__'
    let i = index.get(key)
    if (i === undefined) {
      i = groups.length
      index.set(key, i)
      groups.push({ name: it.sectionName ?? 'Đầu mục báo giá', nameEn: it.sectionNameEn ?? undefined, items: [], sum: 0 })
    }
    groups[i].items.push(it)
    groups[i].sum += it.amount
  }
  return groups
}

export default function QuotePreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: quote, isLoading } = useQuote(id || null)
  const { data: customer } = useCustomer(quote?.customerId ?? null)

  if (isLoading) return <div className="qp-screen"><div className="qp-state">Đang tải dữ liệu...</div></div>
  if (!quote) return <div className="qp-screen"><div className="qp-state">Không tìm thấy báo giá</div></div>

  const contact = customer?.contacts?.find((c) => c.id === quote.contactId)
    ?? customer?.contacts?.find((c) => c.isPrimary)
    ?? (quote.contact ? { fullName: quote.contact.fullName, phone: quote.contact.phone, email: quote.contact.email } : undefined)

  const groups = groupBySection(quote.items ?? [])
  const showSubtotals = groups.length > 1
  const grandLabel = showSubtotals
    ? `Tổng cộng (${groups.map((_, i) => ROMAN[i]).join(' + ')}) / Total`
    : 'Tổng cộng / Total'

  return (
    <div className="qp-screen">
      {/* TOOLBAR */}
      <div className="qp-toolbar no-print">
        <div className="qp-toolbar__left">
          <button className="qp-back" onClick={() => navigate(-1)}><IconArrowLeft size={15} /> Quay lại</button>
          <div className="qp-toolbar__logo">
            <span className="qp-toolbar__logo-icon"><IconFileInvoice size={15} /></span>
            WorkShop Pro <span className="qp-toolbar__sep">/</span> <span className="qp-toolbar__sub">Báo giá</span>
          </div>
          <Badge variant={QUOTE_STATUS_VARIANT[quote.status]} dot>{QUOTE_STATUS_LABELS[quote.status]}</Badge>
        </div>
        <div className="qp-toolbar__right">
          <button className="qp-back" onClick={() => window.print()}><IconPrinter size={15} /> In báo giá</button>
          <button className="qp-back" onClick={() => window.print()}><IconDownload size={15} /> Xuất PDF</button>
        </div>
      </div>

      {/* DOCUMENT */}
      <div className="page-wrap">
        <div className="doc">
          {/* HEADER */}
          <div className="doc-header">
            <div className="dh-top">
              <div className="dh-company">
                <div className="dh-logo-row">
                  <div className="dh-logo-box"><IconBuildingFactory2 size={18} color="#fff" /></div>
                  <div>
                    <div className="dh-company-name">{KOSUMI.name}</div>
                    <div className="dh-company-tagline">{KOSUMI.tagline}</div>
                  </div>
                </div>
                <div className="dh-company-info">
                  {KOSUMI.info.map((line, i) => <div key={i}>{line}</div>)}
                </div>
              </div>
              <div className="dh-right">
                <div className="dh-doc-type">Bảng Báo Giá</div>
                <div className="dh-doc-sub">QUOTATION</div>
                <div className="dh-code">
                  <div className="dh-code-label">Số / No.</div>
                  <div className="dh-code-val">{quote.code}</div>
                </div>
              </div>
            </div>
            <div className="dh-meta">
              <div className="dh-meta-item">
                <div className="dh-meta-label">Ngày / Date</div>
                <div className="dh-meta-val">{formatDate(quote.quoteDate)}</div>
              </div>
              <div className="dh-meta-item">
                <div className="dh-meta-label">Người gửi / Sender</div>
                <div className="dh-meta-val">{KOSUMI.sender}</div>
              </div>
              <div className="dh-meta-item">
                <div className="dh-meta-label">Liên hệ</div>
                <div className="dh-meta-val">{KOSUMI.senderPhone}</div>
              </div>
            </div>
          </div>

          {/* PARTIES */}
          <div className="parties">
            <div className="party">
              <div className="party-label"><IconBuilding size={13} /> Gửi đến / To</div>
              <div className="party-name">{customer?.name ?? quote.customer?.name ?? '—'}</div>
              <div className="party-detail">{customer?.address ?? '—'}</div>
              {contact && <div className="party-contact"><IconMail size={12} /> {contact.fullName}{contact.phone ? ` · ${contact.phone}` : ''}</div>}
            </div>
            <div className="party">
              <div className="party-label"><IconHammer size={13} /> Nhà cung cấp / Supplier</div>
              <div className="party-name">{KOSUMI.name}</div>
              <div className="party-detail">{KOSUMI.partyAddr.map((l, i) => <div key={i}>{l}</div>)}</div>
              <div className="party-contact"><IconMail size={12} /> {KOSUMI.email}</div>
            </div>
          </div>

          {/* PROJECT ROW */}
          <div className="project-row">
            <span className="project-row-label"><IconBuildingSkyscraper size={13} /> Dự án</span>
            <span className="project-row-val">{quote.project?.name ?? '—'}</span>
            <span className="project-row-sep">|</span>
            <span className="project-row-label"><IconList size={13} /> Đầu mục</span>
            <span className="project-row-val">{quote.title}</span>
            <span className="project-row-sep">|</span>
            <span className="project-row-label"><IconCalendar size={13} /> Hiệu lực</span>
            <span className="project-row-val">{quote.validityDays} ngày kể từ ngày báo giá</span>
          </div>

          {/* SECTIONS */}
          {groups.map((g, gi) => (
            <div className="section" key={gi}>
              <div className="section-title">
                <div className="section-num">{ROMAN[gi] ?? gi + 1}</div>
                <span className="section-name">{g.name}</span>
                {g.nameEn && <span className="section-name-en">{g.nameEn}</span>}
                <span className="section-sum">{money(g.sum)} VNĐ</span>
              </div>
              <table className="items-table">
                <thead>
                  <tr>
                    <th className="num">STT</th>
                    <th>Hạng mục / Item</th>
                    <th>Diễn giải / Description</th>
                    <th className="unit">ĐVT</th>
                    <th className="qty">Số lượng</th>
                    <th className="rate">Đơn giá (VNĐ)</th>
                    <th className="amount">Thành tiền (VNĐ)</th>
                  </tr>
                </thead>
                <tbody>
                  {g.items.map((it, ii) => (
                    <tr key={it.id}>
                      <td className="td-num">{ii + 1}</td>
                      <td><div className="td-item">{it.itemName}</div></td>
                      <td><div className="td-desc">{it.description || '—'}</div></td>
                      <td className="td-unit">{it.unit}</td>
                      <td className="td-qty">{money(it.quantity)}</td>
                      <td className="td-rate">{money(it.unitPrice)}</td>
                      <td className="td-amount">{money(it.amount)}</td>
                    </tr>
                  ))}
                  {showSubtotals && (
                    <tr className="sum-row">
                      <td colSpan={6} className="sum-label">Cộng đầu mục {ROMAN[gi]} / Sub-total {ROMAN[gi]}</td>
                      <td className="sum-val">{money(g.sum)}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ))}

          {/* TOTALS */}
          <div className="totals-block">
            <div className="totals-row">
              <table className="totals-table">
                <tbody>
                  <tr><td className="tl">{grandLabel}</td><td className="tv">{money(quote.subtotal ?? 0)}</td></tr>
                  <tr className="tax-row"><td className="tl">Thuế GTGT / VAT ({quote.taxRate}%)</td><td className="tv">{money(quote.taxAmount ?? 0)}</td></tr>
                  <tr><td colSpan={2} style={{ padding: '4px 0' }} /></tr>
                  <tr className="grand-total"><td className="tl">TỔNG THANH TOÁN / GRAND TOTAL</td><td className="tv">{money(quote.totalAmount ?? 0)} VNĐ</td></tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* TERMS */}
          <div className="terms">
            <div className="terms-title"><IconFileDescription size={14} color="var(--color-blue)" /> Điều khoản thỏa thuận / Quotation Appendix</div>
            <div className="terms-grid">
              <div className="terms-item">
                <div className="ti-label">Hiệu lực báo giá / Validity</div>
                <div className="ti-val">{quote.validityDays} ngày kể từ ngày báo giá<br /><span className="ti-sub">{quote.validityDays} days from quotation date</span></div>
              </div>
              <div className="terms-item">
                <div className="ti-label">Thời gian giao hàng / Delivery</div>
                <div className="ti-val">{quote.deliveryDays} ngày (có lắp đặt)<br /><span className="ti-sub">{quote.deliveryDays} days (including installation)</span></div>
              </div>
              <div className="terms-item terms-item--full">
                <div className="ti-label">Điều khoản thanh toán / Payment Terms</div>
                {quote.paymentSteps && quote.paymentSteps.length > 0 ? (
                  <div className="payment-steps">
                    {quote.paymentSteps.map((s) => (
                      <div className="pay-step" key={s.id}>
                        <div className="pay-step-dot" /><span className="pay-step-pct">{s.percentage}%</span> {s.description}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="ti-val">{quote.paymentTerms}</div>
                )}
              </div>
              {quote.warrantyNote && (
                <div className="terms-item terms-item--full">
                  <div className="ti-label">Bảo hành / Warranty</div>
                  <div className="ti-val">{quote.warrantyNote}</div>
                </div>
              )}
            </div>
          </div>

          {/* CONTRACTOR NOTES */}
          <div className="contractor-notes">
            <div className="cn-title"><IconInfoCircle size={13} /> Nhà thầu chính cung cấp (miễn phí) / Provided by Main Contractor</div>
            <ul className="cn-list">
              {quote.contractorNote && <li>{quote.contractorNote}</li>}
              {PROVIDED.map((p, i) => <li key={i}>{p}</li>)}
            </ul>
          </div>

          {/* SIGNATURES */}
          <div className="signatures">
            <div className="sig">
              <div className="sig-label"><IconBuilding size={12} /> Xác nhận khách hàng / Customer Confirmation</div>
              <div className="sig-line" />
              <div className="sig-name">{customer?.name ?? quote.customer?.name ?? '—'}</div>
              <div className="sig-role">Đại diện được ủy quyền</div>
            </div>
            <div className="sig">
              <div className="sig-label"><IconBuildingFactory2 size={12} /> Đại diện nhà cung cấp / Supplier Representative</div>
              <div className="sig-line" />
              <div className="sig-name">{KOSUMI.rep}</div>
              <div className="sig-role">{KOSUMI.repRole}</div>
            </div>
          </div>

          {/* FOOTER */}
          <div className="doc-footer">
            <div className="df-note">Phụ lục và báo giá có giá trị pháp lý ngang nhau · Đã bao gồm điều khoản thỏa thuận.</div>
            <div className="df-page">Trang 1 / 1</div>
          </div>
        </div>
      </div>
    </div>
  )
}
