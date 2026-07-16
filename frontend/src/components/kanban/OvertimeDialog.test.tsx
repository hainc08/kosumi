import '@testing-library/jest-dom'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { OvertimeDialog, type OtWorker } from './OvertimeDialog'

const workers: OtWorker[] = [
  { id: 'w1', fullName: 'Nguyễn Văn A', initials: 'NA', avatarColor: '#f00' },
  { id: 'w2', fullName: 'Trần Thị B', initials: 'TB', avatarColor: '#00f' },
]

const setup = (over: Partial<React.ComponentProps<typeof OvertimeDialog>> = {}) => {
  const onConfirm = vi.fn()
  const onCancel = vi.fn()
  render(<OvertimeDialog open workers={workers} onConfirm={onConfirm} onCancel={onCancel} {...over} />)
  return { onConfirm, onCancel }
}

describe('OvertimeDialog — hiển thị dialog OT để điền thời gian', () => {
  it('không render khi open=false', () => {
    setup({ open: false })
    expect(screen.queryByText('Xin tăng ca')).not.toBeInTheDocument()
  })

  it('hiển thị tiêu đề, mốc 17:15 và một ô nhập giờ (mặc định 2) cho mỗi NV', () => {
    setup()
    expect(screen.getByText('Xin tăng ca')).toBeInTheDocument()
    expect(screen.getByText('17:15')).toBeInTheDocument()
    expect(screen.getByText('Nguyễn Văn A')).toBeInTheDocument()
    expect(screen.getByText('Trần Thị B')).toBeInTheDocument()

    const inputs = screen.getAllByRole('textbox') as HTMLInputElement[]
    expect(inputs).toHaveLength(2)
    expect(inputs.every((i) => i.value === '2')).toBe(true)
  })

  it('nhập giá trị ngoài khoảng 0.5–6 -> nút xác nhận bị vô hiệu', () => {
    setup()
    const confirmBtn = screen.getByRole('button', { name: 'Xác nhận tăng ca' })
    expect(confirmBtn).toBeEnabled()

    const [w1Input] = screen.getAllByRole('textbox') as HTMLInputElement[]
    fireEvent.change(w1Input, { target: { value: '10' } }) // > 6
    expect(confirmBtn).toBeDisabled()

    fireEvent.change(w1Input, { target: { value: '0' } }) // < 0.5
    expect(confirmBtn).toBeDisabled()

    fireEvent.change(w1Input, { target: { value: '3' } }) // hợp lệ trở lại
    expect(confirmBtn).toBeEnabled()
  })

  it('xác nhận trả về map số giờ RIÊNG từng NV', () => {
    const { onConfirm } = setup()
    const [w1Input, w2Input] = screen.getAllByRole('textbox') as HTMLInputElement[]
    fireEvent.change(w1Input, { target: { value: '3' } })
    fireEvent.change(w2Input, { target: { value: '1.5' } })

    fireEvent.click(screen.getByRole('button', { name: 'Xác nhận tăng ca' }))
    expect(onConfirm).toHaveBeenCalledWith({ w1: 3, w2: 1.5 })
  })

  it('bấm Hủy -> gọi onCancel, không confirm', () => {
    const { onConfirm, onCancel } = setup()
    fireEvent.click(screen.getByRole('button', { name: 'Hủy' }))
    expect(onCancel).toHaveBeenCalled()
    expect(onConfirm).not.toHaveBeenCalled()
  })
})
