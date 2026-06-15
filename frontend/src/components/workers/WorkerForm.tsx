import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconUserPlus } from '@tabler/icons-react'
import { POSITION_LABELS, type Position, type Worker } from '@/types'
import { useCreateWorker, useUpdateWorker } from '@/api/workers'
import { useToastStore } from '@/stores/toastStore'
import { FormModal } from '@/components/ui/FormModal'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { WorkerContractSection } from './WorkerContractSection'
import { workerSchema, emptyWorkerForm, workerToForm, formToValues, type WorkerFormShape } from './workerFormShape'
import './WorkerForm.css'

interface WorkerFormProps { open: boolean; onClose: () => void; worker?: Worker | null }

export function WorkerForm({ open, onClose, worker }: WorkerFormProps) {
  const createWorker = useCreateWorker()
  const updateWorker = useUpdateWorker()
  const toast = useToastStore((s) => s.show)
  const isEdit = !!worker

  const form = useForm<WorkerFormShape>({
    resolver: zodResolver(workerSchema),
    defaultValues: worker ? workerToForm(worker) : emptyWorkerForm,
  })
  const { register, handleSubmit, formState: { errors } } = form

  const onSubmit = handleSubmit(async (data) => {
    const values = formToValues(data)
    if (isEdit && worker) {
      await updateWorker.mutateAsync({ id: worker.id, values })
      toast('✓ Đã cập nhật thông tin công nhân')
    } else {
      await createWorker.mutateAsync(values)
      toast('✓ Đã thêm công nhân mới')
    }
    onClose()
  })

  const saving = createWorker.isPending || updateWorker.isPending

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Sửa thông tin công nhân' : 'Thêm công nhân'}
      icon={<IconUserPlus size={18} />}
      size="lg"
      footer={
        <>
          <Button onClick={onClose}>Hủy</Button>
          <Button variant="primary" onClick={onSubmit} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <div className="form-section-title">Thông tin cá nhân</div>
        <div className="form-grid">
          <FormField label="Họ và tên" required error={errors.fullName?.message}>
            <input placeholder="VD: Nguyễn Văn Hùng" {...register('fullName')} />
          </FormField>
          <FormField label="Giới tính" required>
            <select {...register('gender')}>
              <option value="male">Nam</option>
              <option value="female">Nữ</option>
            </select>
          </FormField>
          <FormField label="Ngày sinh">
            <input type="date" {...register('dateOfBirth')} />
          </FormField>
          <FormField label="CCCD">
            <input inputMode="numeric" placeholder="VD: 001090012345" {...register('idNumber')} />
          </FormField>
          <FormField label="Chức vụ" required>
            <select {...register('position')}>
              {(Object.keys(POSITION_LABELS) as Position[]).map((k) => (
                <option key={k} value={k}>{POSITION_LABELS[k]}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Số năm kinh nghiệm" required error={errors.experienceYears?.message}>
            <input inputMode="numeric" {...register('experienceYears')} />
          </FormField>
          <FormField label="Số điện thoại" error={errors.phone?.message}>
            <input inputMode="numeric" placeholder="VD: 0901234567" {...register('phone')} />
          </FormField>
        </div>
        <FormField label="Địa chỉ">
          <input placeholder="VD: Đông Anh, Hà Nội" {...register('address')} />
        </FormField>
        <FormField label="Ghi chú">
          <textarea {...register('notes')} />
        </FormField>

        <WorkerContractSection form={form} />
      </form>
    </FormModal>
  )
}
