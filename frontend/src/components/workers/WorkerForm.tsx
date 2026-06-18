import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconUserPlus } from '@tabler/icons-react'
import { POSITION_LABELS, STAFF_POSITIONS, MANAGEMENT_POSITIONS, type Worker } from '@/types'
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
  const { register, handleSubmit, reset, formState: { errors } } = form

  // Nạp lại dữ liệu mỗi lần mở form (component luôn mounted nên defaultValues
  // chỉ áp lúc đầu — không reset thì Sửa sẽ hiện dữ liệu cũ/trống).
  useEffect(() => {
    if (open) reset(worker ? workerToForm(worker) : emptyWorkerForm)
  }, [open, worker, reset])

  const onSubmit = handleSubmit(async (data) => {
    const values = formToValues(data)
    if (isEdit && worker) {
      await updateWorker.mutateAsync({ id: worker.id, values })
      toast('✓ Đã cập nhật thông tin nhân viên')
    } else {
      await createWorker.mutateAsync(values)
      toast('✓ Đã thêm nhân viên mới')
    }
    onClose()
  })

  const saving = createWorker.isPending || updateWorker.isPending

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Sửa thông tin nhân viên' : 'Thêm nhân viên'}
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
              <optgroup label="Nhân viên">
                {STAFF_POSITIONS.map((k) => <option key={k} value={k}>{POSITION_LABELS[k]}</option>)}
              </optgroup>
              <optgroup label="Quản lý">
                {MANAGEMENT_POSITIONS.map((k) => <option key={k} value={k}>{POSITION_LABELS[k]}</option>)}
              </optgroup>
            </select>
          </FormField>
          <FormField label="Chuyên môn" error={errors.specialty?.message}>
            <input placeholder="VD: Hàn kết cấu, Vận hành CNC" {...register('specialty')} />
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
