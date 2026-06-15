import { useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconFileInvoice, IconPlus, IconTrash } from '@tabler/icons-react'
import { PAYMENT_TERMS_LABELS, type PaymentTermsPreset, type Quote } from '@/types'
import { useCreateQuote, useUpdateQuote } from '@/api/quotes'
import { useProjects } from '@/api/projects'
import { useCustomers } from '@/api/customers'
import { useToastStore } from '@/stores/toastStore'
import { FormModal } from '@/components/ui/FormModal'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import {
  quoteSchema, emptyQuoteForm, quoteToForm, formToValues, type QuoteFormShape,
} from './quoteFormShape'
import './QuoteForm.css'

interface Props { open: boolean; onClose: () => void; quote?: Quote | null }
type Tab = 1 | 2 | 3

export function QuoteForm({ open, onClose, quote }: Props) {
  const [tab, setTab] = useState<Tab>(1)
  const createQuote = useCreateQuote()
  const updateQuote = useUpdateQuote()
  const toast = useToastStore((s) => s.show)
  const isEdit = !!quote

  const { data: projects } = useProjects()
  const { data: customers } = useCustomers()

  const form = useForm<QuoteFormShape>({
    resolver: zodResolver(quoteSchema),
    defaultValues: quote ? quoteToForm(quote) : emptyQuoteForm(),
  })
  const { register, handleSubmit, control, formState: { errors } } = form
  const items = useFieldArray({ control, name: 'items' })
  const paymentSteps = useFieldArray({ control, name: 'paymentSteps' })

  const onSubmit = handleSubmit(async (data) => {
    // Tự động tìm customerId nếu projectId thay đổi và chưa set
    let finalCustomerId = data.customerId
    if (!finalCustomerId && data.projectId && projects) {
      const proj = projects.find(p => p.id === data.projectId)
      if (proj?.customerId) {
        finalCustomerId = proj.customerId
      }
    }

    const values = formToValues({ ...data, customerId: finalCustomerId })
    if (isEdit && quote) {
      await updateQuote.mutateAsync({ id: quote.id, values })
      toast('✓ Đã cập nhật báo giá')
    } else {
      await createQuote.mutateAsync(values)
      toast('✓ Đã thêm báo giá mới')
    }
    onClose()
  })

  const saving = createQuote.isPending || updateQuote.isPending
  const tabClass = (t: Tab) => `quote-tab ${tab === t ? 'quote-tab--active' : ''}`

  return (
    <FormModal
      open={open} onClose={onClose} size="lg"
      title={isEdit ? 'Sửa báo giá' : 'Thêm báo giá'}
      icon={<IconFileInvoice size={18} />}
      footer={
        <>
          <Button onClick={onClose}>Hủy</Button>
          <Button variant="primary" onClick={onSubmit} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu báo giá'}</Button>
        </>
      }
    >
      <div className="quote-tabs">
        <button type="button" className={tabClass(1)} onClick={() => setTab(1)}>Thông tin chung</button>
        <button type="button" className={tabClass(2)} onClick={() => setTab(2)}>Hạng mục ({items.fields.length})</button>
        <button type="button" className={tabClass(3)} onClick={() => setTab(3)}>Thanh toán ({paymentSteps.fields.length})</button>
      </div>

      <form onSubmit={onSubmit}>
        {/* Tab 1: Thông tin chung */}
        <div style={{ display: tab === 1 ? 'block' : 'none' }}>
          <div className="form-grid">
            <FormField label="Dự án" required error={errors.projectId?.message}>
              <select {...register('projectId')}>
                <option value="">-- Chọn dự án --</option>
                {projects?.map(p => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
              </select>
            </FormField>
            
            {/* Nếu không chọn dự án thì cho chọn Khách hàng tự do (hoặc overide) */}
            <FormField label="Khách hàng (Tùy chọn)">
              <select {...register('customerId')}>
                <option value="">-- Theo dự án --</option>
                {customers?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </FormField>

            <div style={{ gridColumn: 'span 2' }}>
              <FormField label="Tên báo giá / Gói thầu" required error={errors.title?.message}>
                <input placeholder="VD: Sản xuất lắp đặt hạng mục..." {...register('title')} />
              </FormField>
            </div>

            <FormField label="Ngày báo giá" required error={errors.quoteDate?.message}>
              <input type="date" {...register('quoteDate')} />
            </FormField>
            <FormField label="Hiệu lực đến">
              <input type="date" {...register('validUntil')} />
            </FormField>

            <FormField label="Thời gian hiệu lực (ngày)" error={errors.validityDays?.message}>
              <input inputMode="numeric" {...register('validityDays')} />
            </FormField>
            <FormField label="Thời gian giao hàng (ngày)" error={errors.deliveryDays?.message}>
              <input inputMode="numeric" {...register('deliveryDays')} />
            </FormField>
            
            <FormField label="Thuế VAT (%)" error={errors.taxRate?.message}>
              <input inputMode="numeric" {...register('taxRate')} />
            </FormField>
            <FormField label="ĐK Thanh toán">
              <select {...register('paymentTerms')}>
                <option value="">-- Chọn điều khoản --</option>
                {(Object.keys(PAYMENT_TERMS_LABELS) as PaymentTermsPreset[]).map((k) => (
                  <option key={k} value={k}>{PAYMENT_TERMS_LABELS[k]}</option>
                ))}
              </select>
            </FormField>
          </div>

          <FormField label="Ghi chú bảo hành">
            <textarea placeholder="VD: Bảo hành 12 tháng..." {...register('warrantyNote')} />
          </FormField>
          <FormField label="Nhà thầu phụ / CĐT cung cấp">
            <textarea placeholder="VD: Mặt bằng thi công do CĐT cấp..." {...register('contractorNote')} />
          </FormField>
          <FormField label="Ghi chú nội bộ">
            <textarea {...register('notes')} />
          </FormField>
        </div>

        {/* Tab 2: Hạng mục */}
        <div style={{ display: tab === 2 ? 'block' : 'none' }}>
          {typeof errors.items?.message === 'string' && <p className="quote-err">{errors.items.message}</p>}
          
          <div className="quote-items">
            {items.fields.map((field, i) => (
              <div key={field.id} className="quote-item-row">
                <div className="quote-item-head">
                  <span className="quote-item-idx">Hạng mục {i + 1}</span>
                  <button type="button" className="quote-item-del" onClick={() => items.remove(i)} aria-label="Xóa">
                    <IconTrash size={15} />
                  </button>
                </div>
                
                <div className="form-grid">
                  <FormField label="Phân nhóm (Section)" error={errors.items?.[i]?.sectionName?.message}>
                    <input placeholder="VD: Cầu thang thép" {...register(`items.${i}.sectionName` as const)} />
                  </FormField>
                  <FormField label="Tên hạng mục" required error={errors.items?.[i]?.itemName?.message}>
                    <input {...register(`items.${i}.itemName` as const)} />
                  </FormField>
                  
                  <div style={{ gridColumn: 'span 2' }}>
                    <FormField label="Diễn giải chi tiết">
                      <textarea rows={2} {...register(`items.${i}.description` as const)} />
                    </FormField>
                  </div>

                  <div className="quote-item-calc">
                    <FormField label="ĐVT" required error={errors.items?.[i]?.unit?.message}>
                      <input {...register(`items.${i}.unit` as const)} />
                    </FormField>
                    <FormField label="Số lượng" required error={errors.items?.[i]?.quantity?.message}>
                      <input inputMode="numeric" {...register(`items.${i}.quantity` as const)} />
                    </FormField>
                    <FormField label="Đơn giá" required error={errors.items?.[i]?.unitPrice?.message}>
                      <input inputMode="numeric" {...register(`items.${i}.unitPrice` as const)} />
                    </FormField>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <Button size="sm" icon={<IconPlus size={14} />}
            onClick={() => items.append({ sectionName: '', itemName: '', description: '', unit: '', quantity: '1', unitPrice: '0', notes: '' })}>
            Thêm hạng mục
          </Button>
        </div>

        {/* Tab 3: Thanh toán */}
        <div style={{ display: tab === 3 ? 'block' : 'none' }}>
          {typeof errors.paymentSteps?.message === 'string' && <p className="quote-err">{errors.paymentSteps.message}</p>}
          
          <div className="quote-steps">
            {paymentSteps.fields.map((field, i) => (
              <div key={field.id} className="quote-step-row">
                <div className="quote-step-col-pct">
                  <FormField label={`Đợt ${i + 1} (%)`} required error={errors.paymentSteps?.[i]?.percentage?.message}>
                    <input inputMode="numeric" {...register(`paymentSteps.${i}.percentage` as const)} />
                  </FormField>
                </div>
                <div className="quote-step-col-desc">
                  <FormField label="Mô tả" required error={errors.paymentSteps?.[i]?.description?.message}>
                    <input {...register(`paymentSteps.${i}.description` as const)} />
                  </FormField>
                </div>
                <div className="quote-step-col-del">
                  <button type="button" className="quote-item-del" onClick={() => paymentSteps.remove(i)} aria-label="Xóa" style={{ marginTop: '22px' }}>
                    <IconTrash size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Button size="sm" icon={<IconPlus size={14} />}
            onClick={() => paymentSteps.append({ stepOrder: paymentSteps.fields.length + 1, percentage: '10', description: '' })}>
            Thêm đợt thanh toán
          </Button>
        </div>

      </form>
    </FormModal>
  )
}
