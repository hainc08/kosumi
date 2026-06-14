import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { IconBuilding } from '@tabler/icons-react'
import {
  PROJECT_TYPE_LABELS, PROJECT_STATUS_LABELS,
  type ProjectType, type ProjectStatus, type Project,
} from '@/types'
import { useCustomers } from '@/api/customers'
import { useSites } from '@/api/sites'
import { useCreateProject, useUpdateProject } from '@/api/projects'
import { useToastStore } from '@/stores/toastStore'
import { FormModal } from '@/components/ui/FormModal'
import { FormField } from '@/components/ui/FormField'
import { Button } from '@/components/ui/Button'
import { projectSchema, emptyProjectForm, projectToForm, formToValues, type ProjectFormShape } from './projectFormShape'
import './ProjectForm.css'

interface Props { open: boolean; onClose: () => void; project?: Project | null }

export function ProjectForm({ open, onClose, project }: Props) {
  const { data: customers = [] } = useCustomers({})
  const { data: sites = [] } = useSites()
  const createProject = useCreateProject()
  const updateProject = useUpdateProject()
  const toast = useToastStore((s) => s.show)
  const isEdit = !!project

  const form = useForm<ProjectFormShape>({
    resolver: zodResolver(projectSchema),
    defaultValues: project ? projectToForm(project) : emptyProjectForm,
  })
  const { register, handleSubmit, formState: { errors } } = form

  const onSubmit = handleSubmit(async (data) => {
    const values = formToValues(data)
    if (isEdit && project) {
      await updateProject.mutateAsync({ id: project.id, values })
      toast('✓ Đã cập nhật dự án')
    } else {
      await createProject.mutateAsync(values)
      toast('✓ Đã thêm dự án mới')
    }
    onClose()
  })

  const saving = createProject.isPending || updateProject.isPending

  return (
    <FormModal
      open={open} onClose={onClose} size="lg"
      title={isEdit ? 'Sửa dự án' : 'Thêm dự án'}
      icon={<IconBuilding size={18} />}
      footer={
        <>
          <Button onClick={onClose}>Hủy</Button>
          <Button variant="primary" onClick={onSubmit} disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</Button>
        </>
      }
    >
      <form onSubmit={onSubmit}>
        <FormField label="Tên dự án" required error={errors.name?.message}>
          <input placeholder="VD: Lan can & cầu thang thép ..." {...register('name')} />
        </FormField>
        <div className="form-grid">
          <FormField label="Chủ đầu tư (Khách hàng)">
            <select {...register('customerId')}>
              <option value="">— Chọn khách hàng —</option>
              {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </FormField>
          <FormField label="Loại công trình" required>
            <select {...register('projectType')}>
              {(Object.keys(PROJECT_TYPE_LABELS) as ProjectType[]).map((k) => (
                <option key={k} value={k}>{PROJECT_TYPE_LABELS[k]}</option>
              ))}
            </select>
          </FormField>
          <FormField label="Công trường thực hiện">
            <select {...register('siteId')}>
              <option value="">— Chọn xưởng —</option>
              {sites.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </FormField>
          <FormField label="Giá trị hợp đồng (đ)">
            <input inputMode="numeric" placeholder="VD: 1250000000" {...register('contractValue')} />
          </FormField>
          <FormField label="Ngày khởi công">
            <input type="date" {...register('startDate')} />
          </FormField>
          <FormField label="Ngày bàn giao" required error={errors.deadline?.message}>
            <input type="date" {...register('deadline')} />
          </FormField>
          {isEdit && (
            <>
              <FormField label="Tiến độ (%)" error={errors.progressPct?.message}>
                <input inputMode="numeric" {...register('progressPct')} />
              </FormField>
              <FormField label="Trạng thái">
                <select {...register('status')}>
                  {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((k) => (
                    <option key={k} value={k}>{PROJECT_STATUS_LABELS[k]}</option>
                  ))}
                </select>
              </FormField>
            </>
          )}
        </div>
        <FormField label="Mô tả">
          <textarea {...register('description')} />
        </FormField>
      </form>
    </FormModal>
  )
}
