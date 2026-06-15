import { useMemo, useRef, useState } from 'react'
import { IconSearch, IconChevronDown, IconUserPlus } from '@tabler/icons-react'
import type { Customer } from '@/types'
import './CustomerCombobox.css'

interface Props {
  customers: Customer[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
}

/** Ô khách hàng cho phép gõ để tìm & chọn khách hàng đã có. */
export function CustomerCombobox({ customers, value, onChange, placeholder = 'Gõ tên hoặc mã khách hàng...' }: Props) {
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const blurTimer = useRef<ReturnType<typeof setTimeout>>()

  const selected = customers.find((c) => c.id === value)
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return customers
    return customers.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
  }, [customers, query])

  const pick = (id: string) => { onChange(id); setQuery(''); setOpen(false) }

  return (
    <div className="ccb" onBlur={() => { blurTimer.current = setTimeout(() => setOpen(false), 120) }}
      onFocus={() => { clearTimeout(blurTimer.current) }}>
      <div className="ccb__control" onClick={() => setOpen((o) => !o)}>
        <IconSearch size={14} className="ccb__icon" />
        <input
          className="ccb__input"
          value={open ? query : selected ? `${selected.name}` : ''}
          placeholder={selected ? selected.name : placeholder}
          onChange={(e) => { setQuery(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
        />
        <IconChevronDown size={15} className="ccb__chev" />
      </div>

      {open && (
        <div className="ccb__menu">
          {filtered.map((c) => (
            <button type="button" key={c.id} className={`ccb__opt ${c.id === value ? 'ccb__opt--on' : ''}`}
              onMouseDown={(e) => { e.preventDefault(); pick(c.id) }}>
              <span className="ccb__opt-name">{c.name}</span>
              <span className="ccb__opt-code">{c.code}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="ccb__empty">
              <IconUserPlus size={15} />
              Chưa có khách hàng này. Hãy thêm ở module <strong>Khách hàng</strong> trước.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
