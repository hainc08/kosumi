import { useEffect, useState } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconBuildingStore, IconPlus, IconTrash } from '@tabler/icons-react'
import {
  CUSTOMER_TYPE_LABELS,
  type CustomerType, type Customer,
} from '@/types'
import { useCreateCustomer, useUpdateCustomer } from '@/api/customers'
import { useToastStore } from '@/stores/toastStore'
import { FormModal } from '@/components/ui/FormModal'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import {
  customerSchema, emptyCustomerForm, customerToForm, formToCreateDto, type CustomerFormShape,
} from './customerFormShape'
import './CustomerForm.css'

interface Props { open: boolean; onClose: () => void; customer?: Customer | null }
type Tab = 1 | 2

export function CustomerForm({ open, onClose, customer }: Props) {
  const [tab, setTab] = useState<Tab>(1)
  const createCustomer = useCreateCustomer()
  const updateCustomer = useUpdateCustomer()
  const toast = useToastStore((s) => s.show)
  const isEdit = !!customer

  const form = useForm<CustomerFormShape>({
    resolver: zodResolver(customerSchema),
    defaultValues: customer ? customerToForm(customer) : emptyCustomerForm,
  })
  const { register, handleSubmit, control, reset, formState: { errors } } = form
  const contacts = useFieldArray({ control, name: 'contacts' })

  // Nạp lại dữ liệu mỗi lần mở form + về tab đầu (component luôn mounted).
  useEffect(() => {
    if (open) { reset(customer ? customerToForm(customer) : emptyCustomerForm); setTab(1) }
  }, [open, customer, reset])

  const onSubmit = handleSubmit(async (data) => {
    const dto = formToCreateDto(data)
    if (isEdit && customer) {
      await updateCustomer.mutateAsync({ id: customer.id, dto })
      toast('✓ Đã cập nhật khách hàng')
    } else {
      await createCustomer.mutateAsync(dto)
      toast('✓ Đã thêm khách hàng mới')
    }
    onClose()
  })

  const saving = createCustomer.isPending || updateCustomer.isPending
  const tabClass = (t: Tab) => `cust-tab ${tab === t ? 'cust-tab--active' : ''}`

  return (
    <FormModal
      open={open} onClose={onClose} size="lg"
      title={isEdit ? 'Sửa khách hàng' : 'Thêm khách hàng'}
      icon={<IconBuildingStore size={18} />}
      footer={
        <>
          <Button onClick={onClose}>Hủy</Button>
          <Button variant="primary" onClick={onSubmit} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
        </>
      }
    >
      <div className="cust-tabs">
        <button type="button" className={tabClass(1)} onClick={() => setTab(1)}>Thông tin chung</button>
        <button type="button" className={tabClass(2)} onClick={() => setTab(2)}>Người liên hệ ({contacts.fields.length})</button>
      </div>

      <form onSubmit={onSubmit}>
        {/* Tab 1 */}
        <div style={{ display: tab === 1 ? 'block' : 'none' }}>
          <div className="form-grid">
            <FormField label="Tên khách hàng / Công ty" required error={errors.name?.message}>
              <input placeholder="VD: Công ty CP ..." {...register('name')} />
            </FormField>
            <FormField label="Loại khách hàng" required>
              <select {...register('type')}>
                {(Object.keys(CUSTOMER_TYPE_LABELS) as CustomerType[]).map((k) => (
                  <option key={k} value={k}>{CUSTOMER_TYPE_LABELS[k]}</option>
                ))}
              </select>
            </FormField>
            <FormField label="Mã số thuế">
              <input inputMode="numeric" {...register('taxCode')} />
            </FormField>
            <FormField label="Website">
              <input placeholder="VD: company.vn" {...register('website')} />
            </FormField>
            <FormField label="Ngành nghề KD chính">
              <input placeholder="VD: Xây dựng, Cơ khí chính xác, kết cấu thép..." {...register('industry')} />
            </FormField>
          </div>
          <FormField label="Địa chỉ trụ sở">
            <input placeholder="Số nhà, đường, quận/huyện, tỉnh/thành" {...register('address')} />
          </FormField>
          <FormField label="Ghi chú">
            <textarea {...register('notes')} />
          </FormField>
        </div>

        {/* Tab 2 */}
        <div style={{ display: tab === 2 ? 'block' : 'none' }}>
          {typeof errors.contacts?.message === 'string' && <p className="cust-err">{errors.contacts.message}</p>}
          {contacts.fields.map((field, i) => (
            <div key={field.id} className="cust-contact">
              <div className="cust-contact__head">
                <span className="cust-contact__idx">{i === 0 ? 'Liên hệ chính' : `Liên hệ ${i + 1}`}</span>
                {i === 0 ? <span className="cust-contact__primary">Chính</span> : (
                  <button type="button" className="cust-contact__del" onClick={() => contacts.remove(i)} aria-label="Xóa">
                    <IconTrash size={15} />
                  </button>
                )}
              </div>
              <div className="form-grid">
                <FormField label="Họ tên" required error={errors.contacts?.[i]?.fullName?.message}>
                  <input {...register(`contacts.${i}.fullName` as const)} />
                </FormField>
                <FormField label="Chức vụ">
                  <input {...register(`contacts.${i}.title` as const)} />
                </FormField>
                <FormField label="Số điện thoại">
                  <input inputMode="numeric" {...register(`contacts.${i}.phone` as const)} />
                </FormField>
                <FormField label="Email">
                  <input {...register(`contacts.${i}.email` as const)} />
                </FormField>
              </div>
            </div>
          ))}
          <Button size="sm" icon={<IconPlus size={14} />}
            onClick={() => contacts.append({ fullName: '', title: '', phone: '', email: '' })}>
            Thêm người liên hệ
          </Button>
        </div>


      </form>
    </FormModal>
  )
}
