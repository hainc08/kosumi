import { useParams, useNavigate } from 'react-router-dom'
import { useQuote } from '@/api/quotes'
import { formatCurrency, formatDate } from '@/utils/format'
import { IconArrowLeft, IconPrinter } from '@tabler/icons-react'
import { Badge } from '@/components/ui/Badge'
import { QUOTE_STATUS_VARIANT } from '@/components/quotes/QuoteDetailDrawer'
import { QUOTE_STATUS_LABELS } from '@/types'
import './QuotePreview.css'

export default function QuotePreviewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: quote, isLoading } = useQuote(id || null)

  if (isLoading) return <div className="qp-loading">Đang tải dữ liệu...</div>
  if (!quote) return <div className="qp-error">Không tìm thấy báo giá</div>

  return (
    <div className="qp-container">
      {/* Toolbar - Ẩn khi in */}
      <div className="qp-toolbar no-print">
        <button className="qp-btn-back" onClick={() => navigate(-1)}>
          <IconArrowLeft size={16} /> Quay lại
        </button>
        <div className="qp-meta">
          <span>{quote.code}</span>
          <Badge variant={QUOTE_STATUS_VARIANT[quote.status]} dot>{QUOTE_STATUS_LABELS[quote.status]}</Badge>
        </div>
        <button className="qp-btn-print" onClick={() => window.print()}>
          <IconPrinter size={16} /> In / Lưu PDF
        </button>
      </div>

      {/* A4 Paper */}
      <div className="qp-paper">
        <div className="qp-header">
          <div className="qp-logo-area">
            <div className="qp-logo-box">K</div>
            <div className="qp-company">
              <strong>CÔNG TY CỔ PHẦN KOSUMI</strong>
              <p>Lô A, KCN Thăng Long, H. Đông Anh, TP. Hà Nội</p>
              <p>MST: 0123456789 - Hotline: 0988.123.456</p>
            </div>
          </div>
          <div className="qp-title">
            <h1>BẢNG BÁO GIÁ</h1>
            <h2>QUOTATION</h2>
          </div>
        </div>

        <div className="qp-info-grid">
          <div className="qp-info-col">
            <div className="qp-info-row"><span>Kính gửi / To:</span> <strong>{quote.customer?.name}</strong></div>
            <div className="qp-info-row"><span>Người nhận / Attn:</span> {quote.contact?.fullName || '—'} - {quote.contact?.phone}</div>
            <div className="qp-info-row"><span>Dự án / Project:</span> {quote.project?.name}</div>
            <div className="qp-info-row"><span>Gói thầu / Title:</span> {quote.title}</div>
          </div>
          <div className="qp-info-col">
            <div className="qp-info-row"><span>Số BG / Ref No:</span> <strong>{quote.code}</strong></div>
            <div className="qp-info-row"><span>Ngày / Date:</span> {formatDate(quote.quoteDate)}</div>
            <div className="qp-info-row"><span>Hiệu lực / Valid until:</span> {formatDate(quote.validUntil)}</div>
            <div className="qp-info-row"><span>Nhân viên / PIC:</span> Admin</div>
          </div>
        </div>

        <table className="qp-table">
          <thead>
            <tr>
              <th style={{ width: '50px', textAlign: 'center' }}>STT</th>
              <th>Hạng mục / Mô tả (Description)</th>
              <th style={{ width: '60px', textAlign: 'center' }}>ĐVT</th>
              <th style={{ width: '80px', textAlign: 'right' }}>SL</th>
              <th style={{ width: '120px', textAlign: 'right' }}>Đơn giá (VNĐ)</th>
              <th style={{ width: '140px', textAlign: 'right' }}>Thành tiền (VNĐ)</th>
            </tr>
          </thead>
          <tbody>
            {quote.items?.map((item, index) => (
              <tr key={item.id}>
                <td style={{ textAlign: 'center' }}>{index + 1}</td>
                <td>
                  <div className="qp-item-name">{item.itemName}</div>
                  {item.description && <div className="qp-item-desc">{item.description}</div>}
                </td>
                <td style={{ textAlign: 'center' }}>{item.unit}</td>
                <td style={{ textAlign: 'right' }}>{item.quantity}</td>
                <td style={{ textAlign: 'right' }}>{formatCurrency(item.unitPrice).replace(' ₫', '')}</td>
                <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(item.amount).replace(' ₫', '')}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5} style={{ textAlign: 'right' }}>Cộng tiền hàng (Subtotal):</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(quote.subtotal || 0).replace(' ₫', '')}</td>
            </tr>
            <tr>
              <td colSpan={5} style={{ textAlign: 'right' }}>Thuế GTGT (VAT {quote.taxRate}%):</td>
              <td style={{ textAlign: 'right', fontWeight: 600 }}>{formatCurrency(quote.taxAmount || 0).replace(' ₫', '')}</td>
            </tr>
            <tr className="qp-total-row">
              <td colSpan={5} style={{ textAlign: 'right' }}>TỔNG CỘNG (GRAND TOTAL):</td>
              <td style={{ textAlign: 'right' }}>{formatCurrency(quote.totalAmount || 0).replace(' ₫', '')}</td>
            </tr>
          </tfoot>
        </table>

        <div className="qp-terms">
          <h3>ĐIỀU KHOẢN THƯƠNG MẠI / COMMERCIAL TERMS</h3>
          <ul>
            <li><strong>Thời gian giao hàng:</strong> {quote.deliveryDays} ngày kể từ ngày nhận tạm ứng.</li>
            <li><strong>Điều khoản thanh toán:</strong> {quote.paymentTerms}</li>
            {quote.paymentSteps?.map(step => (
              <li key={step.id} className="qp-term-sub">- Đợt {step.stepOrder}: Thanh toán {step.percentage}% {step.description}</li>
            ))}
            {quote.warrantyNote && <li><strong>Bảo hành:</strong> {quote.warrantyNote}</li>}
            {quote.contractorNote && <li><strong>Ghi chú khác:</strong> {quote.contractorNote}</li>}
          </ul>
        </div>

        <div className="qp-signatures">
          <div className="qp-sig-box">
            <strong>ĐẠI DIỆN KHÁCH HÀNG</strong>
            <em>(Ký, ghi rõ họ tên và đóng dấu)</em>
          </div>
          <div className="qp-sig-box">
            <strong>ĐẠI DIỆN KOSUMI</strong>
            <em>(Ký, ghi rõ họ tên)</em>
          </div>
        </div>
      </div>
    </div>
  )
}
