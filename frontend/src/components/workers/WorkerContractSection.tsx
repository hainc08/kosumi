import { Controller, type UseFormReturn } from 'react-hook-form'
import { CONTRACT_TYPE_LABELS, type ContractType } from '@/types'
import { formatCurrency } from '@/utils/format'
import { FormField } from '@/components/ui/FormField'
import { CurrencyInput } from '@/components/ui/CurrencyInput'
import type { WorkerFormShape } from './workerFormShape'
import './WorkerContractSection.css'

const num = (s: string): number | undefined => (s.trim() === '' ? undefined : Number(s))

export function WorkerContractSection({ form }: { form: UseFormReturn<WorkerFormShape> }) {
  const { register, control, watch, formState: { errors } } = form
  const type = watch('contractType') as ContractType

  const totalMonthly = (() => {
    const base = num(watch('baseSalary')) ?? 0
    const resp = num(watch('allowanceResponsibility')) ?? 0
    const att  = num(watch('allowanceAttendance')) ?? 0
    return base + resp + att
  })()

  return (
    <div className="contract-section">
      <div className="contract-section__title">Hợp đồng &amp; Tiền lương</div>
      <div className="form-grid">
        <FormField label="Loại hợp đồng" required>
          <select {...register('contractType')}>
            {(Object.keys(CONTRACT_TYPE_LABELS) as ContractType[]).map((k) => (
              <option key={k} value={k}>{CONTRACT_TYPE_LABELS[k]}</option>
            ))}
          </select>
        </FormField>
        <FormField label="Ngày bắt đầu" required error={errors.startDate?.message}>
          <input type="date" {...register('startDate')} />
        </FormField>

        {/* Lương cơ bản – áp dụng cho HĐ chính thức & thử việc */}
        {(type === 'official' || type === 'probation') && (
          <>
            <FormField label="Lương cơ bản / tháng (đ)" required error={errors.baseSalary?.message}>
              <Controller control={control} name="baseSalary"
                render={({ field }) => <CurrencyInput {...field} placeholder="VD: 9.000.000" />} />
            </FormField>
            <FormField label="Phụ cấp trách nhiệm / tháng (đ)" hint="Tùy theo chức vụ">
              <Controller control={control} name="allowanceResponsibility"
                render={({ field }) => <CurrencyInput {...field} placeholder="VD: 500.000" />} />
            </FormField>
            <FormField label="Phụ cấp chuyên cần / tháng (đ)" hint="Thưởng đi làm đầy đủ">
              <Controller control={control} name="allowanceAttendance"
                render={({ field }) => <CurrencyInput {...field} placeholder="VD: 300.000" />} />
            </FormField>
          </>
        )}

        {/* HĐ giao khoán – theo đơn giá / đơn vị */}
        {type === 'piece_rate' && (
          <>
            <FormField label="Đơn giá / đơn vị (đ)" required error={errors.ratePerUnit?.message}>
              <Controller control={control} name="ratePerUnit"
                render={({ field }) => <CurrencyInput {...field} placeholder="VD: 150.000" />} />
            </FormField>
            <FormField label="Tên đơn vị" required error={errors.unitName?.message}>
              <input placeholder="VD: sản phẩm, m², bộ" {...register('unitName')} />
            </FormField>
          </>
        )}
      </div>

      {(type === 'official' || type === 'probation') && totalMonthly > 0 && (
        <div className="contract-section__estimate">
          Tổng thu nhập ước tính: <strong>{formatCurrency(totalMonthly)}</strong>
          <span> (lương + phụ cấp trách nhiệm + chuyên cần)</span>
        </div>
      )}
    </div>
  )
}
