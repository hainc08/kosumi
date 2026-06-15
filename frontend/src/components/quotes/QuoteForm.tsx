import { useEffect, useMemo } from 'react'
import { useForm, useFieldArray, Controller, type Control, type UseFormRegister, type FieldErrors } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconFileInvoice, IconPlus, IconTrash, IconSend } from '@tabler/icons-react'
import { PAYMENT_TERMS_LABELS, type PaymentTermsPreset, type Quote } from '@/types'
import { useCreateQuote, useUpdateQuote, useUpdateQuoteStatus, useNextQuoteCode } from '@/api/quotes'
import { useProjects } from '@/api/projects'
import { useCustomers } from '@/api/customers'
import { useToastStore } from '@/stores/toastStore'
import { FormModal } from '@/components/ui/FormModal'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import { CustomerCombobox } from './CustomerCombobox'
import {
  quoteSchema, emptyQuoteForm, quoteToForm, formToValues, addDaysStr, type QuoteFormShape,
} from './quoteFormShape'
import './QuoteForm.css'

interface Props { open: boolean; onClose: () => void; quote?: Quote | null }

export function QuoteForm({ open, onClose, quote }: Props) {
  const createQuote = useCreateQuote()
  const updateQuote = useUpdateQuote()
  const updateStatus = useUpdateQuoteStatus()
  const toast = useToastStore((s) => s.show)
  const isEdit = !!quote

  const { data: projects = [] } = useProjects()
  const { data: customers = [] } = useCustomers()

  const form = useForm<QuoteFormShape>({
    resolver: zodResolver(quoteSchema),
    defaultValues: quote ? quoteToForm(quote) : emptyQuoteForm(),
  })
  const { register, handleSubmit, control, setValue, watch, reset, formState: { errors } } = form
  const sections = useFieldArray({ control, name: 'sections' })
  const paymentSteps = useFieldArray({ control, name: 'paymentSteps' })

  // Reset form mỗi lần mở (tạo mới preview mã + 30 ngày, hoặc nạp dữ liệu sửa)
  useEffect(() => {
    if (open) reset(quote ? quoteToForm(quote) : emptyQuoteForm())
  }, [open, quote, reset])

  const hasProject = watch('hasProject')
  const quoteDate = watch('quoteDate')
  const validityDays = watch('validityDays')
  const customerId = watch('customerId')

  // Hiệu lực tự tính = ngày báo giá + số ngày hiệu lực
  useEffect(() => {
    if (quoteDate && validityDays && !Number.isNaN(Number(validityDays))) {
      setValue('validUntil', addDaysStr(quoteDate, Number(validityDays)))
    }
  }, [quoteDate, validityDays, setValue])

  const { data: nextCode } = useNextQuoteCode()
  const code = useMemo(() => (quote ? quote.code : (nextCode ?? '— tự sinh —')), [quote, nextCode])
  const saving = createQuote.isPending || updateQuote.isPending || updateStatus.isPending

  const persist = async (data: QuoteFormShape): Promise<string> => {
    const values = formToValues(data)
    if (isEdit && quote) {
      await updateQuote.mutateAsync({ id: quote.id, values })
      return quote.id
    }
    const created = await createQuote.mutateAsync(values)
    return created.id
  }

  const onSave = handleSubmit(async (data) => {
    await persist(data)
    toast(isEdit ? '✓ Đã cập nhật báo giá' : '✓ Đã lưu báo giá (nháp)')
    onClose()
  })

  const onSubmitApproval = handleSubmit(async (data) => {
    const id = await persist(data)
    await updateStatus.mutateAsync({ id, status: 'pending' })
    toast('✓ Đã gửi duyệt báo giá')
    onClose()
  })

  return (
    <FormModal
      open={open} onClose={onClose} size="xl"
      title={isEdit ? 'Sửa báo giá' : 'Tạo báo giá mới'}
      icon={<IconFileInvoice size={18} />}
      footer={
        <>
          <Button onClick={onClose}>Hủy</Button>
          <Button onClick={onSave} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu báo giá'}</Button>
          <Button variant="primary" icon={<IconSend size={15} />} onClick={onSubmitApproval} disabled={saving}>Gửi duyệt báo giá</Button>
        </>
      }
    >
      <form onSubmit={onSave} className="qf">
        {/* ── THÔNG TIN CHUNG ── */}
        <div className="qf-section-label">Thông tin chung</div>
        <div className="form-grid">
          <FormField label="Số báo giá (tự sinh)">
            <input value={code} readOnly className="qf-readonly" />
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

        <label className="qf-check">
          <input type="checkbox" {...register('hasProject')} />
          Dự án đã có
        </label>

        {hasProject ? (
          <FormField label="Dự án" required error={errors.projectId?.message}>
            <select {...register('projectId')}>
              <option value="">-- Chọn dự án --</option>
              {projects.map((p) => <option key={p.id} value={p.id}>{p.code} - {p.name}</option>)}
            </select>
          </FormField>
        ) : (
          <div className="qf-hint">Bỏ chọn "Dự án đã có" → <strong>tên gói thầu</strong> bên dưới sẽ được tạo thành một <strong>dự án mới</strong>.</div>
        )}

        <FormField label="Khách hàng" required={!hasProject} error={errors.customerId?.message}>
          <CustomerCombobox customers={customers} value={customerId} onChange={(id) => setValue('customerId', id, { shouldValidate: true })} />
        </FormField>

        <FormField label="Đầu mục / Tên gói thầu" required error={errors.title?.message}>
          <input placeholder="VD: Hệ thống lan can toàn bộ dự án" {...register('title')} />
        </FormField>

        <div className="form-grid form-grid--3">
          <FormField label="Ngày báo giá" required error={errors.quoteDate?.message}>
            <input type="date" {...register('quoteDate')} />
          </FormField>
          <FormField label="Hiệu lực (ngày)" error={errors.validityDays?.message}>
            <input inputMode="numeric" {...register('validityDays')} />
          </FormField>
          <FormField label="Hết hiệu lực (tự tính)">
            <input type="date" value={watch('validUntil')} readOnly className="qf-readonly" />
          </FormField>
          <FormField label="Giao hàng (ngày)" error={errors.deliveryDays?.message}>
            <input inputMode="numeric" {...register('deliveryDays')} />
          </FormField>
          <FormField label="Thuế VAT (%)" error={errors.taxRate?.message}>
            <input inputMode="numeric" {...register('taxRate')} />
          </FormField>
        </div>

        {/* ── HẠNG MỤC & DANH MỤC ── */}
        <div className="qf-section-label">Hạng mục & danh mục</div>
        {typeof errors.sections?.message === 'string' && <p className="quote-err">{errors.sections.message}</p>}

        <div className="qf-sections">
          {sections.fields.map((field, si) => (
            <div key={field.id} className="qf-sec">
              <div className="qf-sec__head">
                <span className="qf-sec__idx">Hạng mục {si + 1}</span>
                <button type="button" className="quote-item-del" onClick={() => sections.remove(si)} aria-label="Xóa hạng mục"><IconTrash size={15} /></button>
              </div>
              <div className="form-grid">
                <FormField label="Tên hạng mục" required error={errors.sections?.[si]?.name?.message}>
                  <input placeholder="VD: Cầu thang thép" {...register(`sections.${si}.name` as const)} />
                </FormField>
                <FormField label="Tên hạng mục (EN)">
                  <input placeholder="VD: Steel Staircase" {...register(`sections.${si}.nameEn` as const)} />
                </FormField>
              </div>
              <SectionLines control={control} register={register} errors={errors} sectionIndex={si} />
            </div>
          ))}
        </div>

        <Button size="sm" icon={<IconPlus size={14} />}
          onClick={() => sections.append({ name: '', nameEn: '', items: [{ itemName: '', description: '', unit: '', quantity: '1', unitPrice: '0' }] })}>
          Thêm hạng mục
        </Button>

        {/* ── THANH TOÁN ── */}
        <div className="qf-section-label">Đợt thanh toán</div>
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
                <button type="button" className="quote-item-del" onClick={() => paymentSteps.remove(i)} aria-label="Xóa" style={{ marginTop: '22px' }}><IconTrash size={16} /></button>
              </div>
            </div>
          ))}
        </div>
        <Button size="sm" icon={<IconPlus size={14} />}
          onClick={() => paymentSteps.append({ stepOrder: paymentSteps.fields.length + 1, percentage: '10', description: '' })}>
          Thêm đợt thanh toán
        </Button>

        {/* ── GHI CHÚ ── */}
        <div className="qf-section-label">Ghi chú</div>
        <FormField label="Ghi chú bảo hành">
          <textarea placeholder="VD: Bảo hành 12 tháng..." {...register('warrantyNote')} />
        </FormField>
        <FormField label="Nhà thầu chính / CĐT cung cấp">
          <textarea placeholder="VD: Mặt bằng thi công do CĐT cấp..." {...register('contractorNote')} />
        </FormField>
        <FormField label="Ghi chú nội bộ">
          <textarea {...register('notes')} />
        </FormField>
      </form>
    </FormModal>
  )
}

/** Danh mục (line items) lồng trong 1 hạng mục — nested useFieldArray. */
function SectionLines({ control, register, errors, sectionIndex }: {
  control: Control<QuoteFormShape>
  register: UseFormRegister<QuoteFormShape>
  errors: FieldErrors<QuoteFormShape>
  sectionIndex: number
}) {
  const lines = useFieldArray({ control, name: `sections.${sectionIndex}.items` as const })
  const lineErr = errors.sections?.[sectionIndex]?.items

  return (
    <div className="qf-lines">
      {typeof lineErr?.message === 'string' && <p className="quote-err">{lineErr.message}</p>}
      {lines.fields.map((field, li) => (
        <div key={field.id} className="qf-line">
          <div className="qf-line__main">
            <FormField label={`Danh mục ${li + 1}`} required error={errors.sections?.[sectionIndex]?.items?.[li]?.itemName?.message}>
              <input placeholder="VD: Lan can cầu thang thép" {...register(`sections.${sectionIndex}.items.${li}.itemName` as const)} />
            </FormField>
            <FormField label="Diễn giải">
              <input placeholder="Mô tả chi tiết (tuỳ chọn)" {...register(`sections.${sectionIndex}.items.${li}.description` as const)} />
            </FormField>
          </div>
          <div className="qf-line__calc">
            <FormField label="ĐVT" required error={errors.sections?.[sectionIndex]?.items?.[li]?.unit?.message}>
              <input placeholder="m, kg..." {...register(`sections.${sectionIndex}.items.${li}.unit` as const)} />
            </FormField>
            <FormField label="SL" required error={errors.sections?.[sectionIndex]?.items?.[li]?.quantity?.message}>
              <input inputMode="numeric" {...register(`sections.${sectionIndex}.items.${li}.quantity` as const)} />
            </FormField>
            <FormField label="Đơn giá" required error={errors.sections?.[sectionIndex]?.items?.[li]?.unitPrice?.message}>
              <Controller
                control={control}
                name={`sections.${sectionIndex}.items.${li}.unitPrice` as const}
                render={({ field }) => (
                  <CurrencyInput {...field} placeholder="VD: 1.500.000" />
                )}
              />
            </FormField>
            <button type="button" className="quote-item-del qf-line__del" onClick={() => lines.remove(li)} aria-label="Xóa danh mục"><IconTrash size={15} /></button>
          </div>
        </div>
      ))}
      <button type="button" className="qf-add-line" onClick={() => lines.append({ itemName: '', description: '', unit: '', quantity: '1', unitPrice: '0' })}>
        <IconPlus size={13} /> Thêm danh mục
      </button>
    </div>
  )
}
