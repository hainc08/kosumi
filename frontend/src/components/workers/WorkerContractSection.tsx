import type { UseFormReturn } from 'react-hook-form'
import { CONTRACT_TYPE_LABELS, type ContractType } from '@/types'
import { estimateMonthlyPay } from '@/utils/pay-calculator'
import { formatCurrency } from '@/utils/format'
import { FormField } from '@/components/ui/FormField'
import type { WorkerFormShape } from './workerFormShape'
import './WorkerContractSection.css'

const num = (s: string): number | undefined => (s.trim() === '' ? undefined : Number(s))

export function WorkerContractSection({ form }: { form: UseFormReturn<WorkerFormShape> }) {
  const { register, watch, formState: { errors } } = form
  const type = watch('contractType')

  const estimate = (() => {
    const ct = type as ContractType
    if (ct === 'hourly' || ct === 'daily') {
      const r = num(watch('rateNormal'))
      return r ? estimateMonthlyPay({ contractType: ct, rateNormal: r }) : 0
    }
    if (ct === 'monthly') {
      return estimateMonthlyPay({
        contractType: 'monthly', baseSalary: num(watch('baseSalary')) ?? 0, allowance: num(watch('allowance')) ?? 0,
      })
    }
    return 0
  })()

  const estimateNote = type === 'hourly' || type === 'daily'
    ? '(26 ngày × 8 giờ/ngày)'
    : type === 'monthly' ? '(lương cơ bản + phụ cấp)' : ''

  return (
    <div className="contract-section">
      <div className="contract-section__title">Hợp đồng & Tiền công</div>
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

        {(type === 'hourly' || type === 'daily') && (
          <>
            <FormField label={type === 'hourly' ? 'Đơn giá / giờ (đ)' : 'Đơn giá / ngày (đ)'} required error={errors.rateNormal?.message}>
              <input inputMode="numeric" placeholder="VD: 45000" {...register('rateNormal')} />
            </FormField>
            <FormField label="Đơn giá OT (đ)" hint="Mặc định = đơn giá × 1.5">
              <input inputMode="numeric" placeholder="VD: 67500" {...register('rateOvertime')} />
            </FormField>
          </>
        )}
        {type === 'monthly' && (
          <>
            <FormField label="Lương cơ bản / tháng (đ)" required error={errors.baseSalary?.message}>
              <input inputMode="numeric" placeholder="VD: 9000000" {...register('baseSalary')} />
            </FormField>
            <FormField label="Phụ cấp / tháng (đ)">
              <input inputMode="numeric" placeholder="VD: 800000" {...register('allowance')} />
            </FormField>
          </>
        )}
        {type === 'piece' && (
          <>
            <FormField label="Đơn giá / đơn vị (đ)" required error={errors.ratePerUnit?.message}>
              <input inputMode="numeric" placeholder="VD: 150000" {...register('ratePerUnit')} />
            </FormField>
            <FormField label="Tên đơn vị" required error={errors.unitName?.message}>
              <input placeholder="VD: sản phẩm, m², bộ" {...register('unitName')} />
            </FormField>
          </>
        )}
      </div>

      {type !== 'piece' && (
        <div className="contract-section__estimate">
          Ước tính: <strong>{estimate > 0 ? formatCurrency(estimate) : '—'}</strong> <span>{estimateNote}</span>
        </div>
      )}
    </div>
  )
}
