/**
 * CurrencyInput — input tiền tệ với format dấu chấm nghìn tự động.
 *
 * Sử dụng với react-hook-form Controller:
 *   <Controller control={control} name="baseSalary"
 *     render={({ field }) => <CurrencyInput {...field} />} />
 *
 * Hoặc standalone:
 *   <CurrencyInput value={val} onChange={setVal} />
 *
 * Giá trị vào/ra: chuỗi số thuần không có dấu "9000000"
 * Hiển thị:       "9.000.000" (dấu chấm phân cách nghìn kiểu Việt)
 */

import { forwardRef, useEffect, useRef, useState, type InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value' | 'type'> & {
  value?: string | number | null
  onChange?: (raw: string) => void
  placeholder?: string
}

function stripNonDigit(s: string): string {
  return s.replace(/\D/g, '')
}

function formatVND(raw: string): string {
  if (!raw || raw === '0') return raw === '0' ? '0' : ''
  const n = parseInt(raw, 10)
  if (isNaN(n)) return ''
  return n.toLocaleString('vi-VN')
}

export const CurrencyInput = forwardRef<HTMLInputElement, Props>(
  function CurrencyInput({ value, onChange, onBlur, placeholder = '0', className, ...rest }, ref) {
    const [display, setDisplay] = useState<string>(() => {
      const raw = stripNonDigit(String(value ?? ''))
      return raw ? formatVND(raw) : ''
    })

    // Sync khi value từ bên ngoài thay đổi (reset form, edit mode...)
    const prevValue = useRef<string | number | null | undefined>(undefined)
    useEffect(() => {
      if (value === prevValue.current) return
      prevValue.current = value
      const raw = stripNonDigit(String(value ?? ''))
      setDisplay(raw ? formatVND(raw) : '')
    }, [value])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const input = e.target
      const caretPos = input.selectionStart ?? 0
      const oldDisplayLen = display.length
      const raw = stripNonDigit(input.value)
      const newDisplay = raw ? formatVND(raw) : ''

      setDisplay(newDisplay)
      onChange?.(raw)

      // Restore caret position sau khi format
      requestAnimationFrame(() => {
        if (!input) return
        const delta = newDisplay.length - oldDisplayLen
        const newPos = Math.max(0, caretPos + delta)
        input.setSelectionRange(newPos, newPos)
      })
    }

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      // Khi blur, nếu display = "0" thì clear
      if (display === '0') setDisplay('')
      onBlur?.(e)
    }

    return (
      <input
        {...rest}
        ref={ref}
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        onBlur={handleBlur}
        placeholder={placeholder}
        className={className}
      />
    )
  },
)
