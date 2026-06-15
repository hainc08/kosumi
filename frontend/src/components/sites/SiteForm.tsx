import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconBuildingFactory2 } from '@tabler/icons-react'
import {
  SITE_TYPE_LABELS, SITE_STATUS_LABELS, type SiteType, type SiteStatus, type Site,
} from '@/types'
import { useCreateSite, useUpdateSite } from '@/api/sites'
import { useToastStore } from '@/stores/toastStore'
import { FormModal } from '@/components/ui/FormModal'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { siteSchema, emptySiteForm, siteToForm, formToValues, type SiteFormShape } from './siteFormShape'
import './SiteForm.css'

interface Props { open: boolean; onClose: () => void; site?: Site | null }

export function SiteForm({ open, onClose, site }: Props) {
  const createSite = useCreateSite()
  const updateSite = useUpdateSite()
  const toast = useToastStore((s) => s.show)
  const isEdit = !!site

  const form = useForm<SiteFormShape>({
    resolver: zodResolver(siteSchema),
    defaultValues: site ? siteToForm(site) : emptySiteForm(),
  })
  const { register, handleSubmit, reset, formState: { errors } } = form

  const onSubmit = handleSubmit(async (data) => {
    const values = formToValues(data)
    if (isEdit && site) {
      await updateSite.mutateAsync({ id: site.id, values })
      toast('✓ Đã cập nhật công trường')
    } else {
      await createSite.mutateAsync(values)
      toast('✓ Đã thêm công trường mới')
    }
    onClose()
  })

  const saving = createSite.isPending || updateSite.isPending

  return (
    <FormModal
      open={open} onClose={() => { reset(); onClose() }} size="lg"
      title={isEdit ? 'Sửa công trường / xưởng' : 'Thêm công trường / xưởng'}
      icon={<IconBuildingFactory2 size={18} />}
      footer={
        <>
          <Button onClick={onClose}>Hủy</Button>
          <Button variant="primary" onClick={onSubmit} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <FormField label="Tên công trường / xưởng" required error={errors.name?.message}>
          <input placeholder="VD: Xưởng Cơ khí Hà Nội" {...register('name')} />
        </FormField>
        <div className="form-grid">
          <FormField label="Loại" required>
            <select {...register('type')}>
              {(Object.keys(SITE_TYPE_LABELS) as SiteType[]).map((k) => <option key={k} value={k}>{SITE_TYPE_LABELS[k]}</option>)}
            </select>
          </FormField>
          <FormField label="Trạng thái">
            <select {...register('status')}>
              {(Object.keys(SITE_STATUS_LABELS) as SiteStatus[]).map((k) => <option key={k} value={k}>{SITE_STATUS_LABELS[k]}</option>)}
            </select>
          </FormField>
          <FormField label="Khu công nghiệp">
            <input placeholder="VD: KCN Thăng Long" {...register('industrialZone')} />
          </FormField>
          <FormField label="Tỉnh / Thành phố">
            <input placeholder="VD: Hà Nội" {...register('city')} />
          </FormField>
        </div>
        <FormField label="Địa chỉ" required error={errors.address?.message}>
          <input placeholder="Số nhà, đường, phường/xã, quận/huyện" {...register('address')} />
        </FormField>
        <div className="form-grid">
          <FormField label="Điện thoại">
            <input inputMode="tel" placeholder="VD: 0241234567" {...register('phone')} />
          </FormField>
          <FormField label="Diện tích (m²)" error={errors.areaM2?.message}>
            <input inputMode="numeric" placeholder="VD: 1200" {...register('areaM2')} />
          </FormField>
        </div>
        <FormField label="Ghi chú">
          <textarea {...register('notes')} />
        </FormField>
      </form>
    </FormModal>
  )
}
