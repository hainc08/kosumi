import { IconSearch } from '@tabler/icons-react'
import './SearchBox.css'

interface SearchBoxProps { value: string; onChange: (v: string) => void; placeholder?: string; width?: string }

export function SearchBox({ value, onChange, placeholder = 'Tìm kiếm...', width }: SearchBoxProps) {
  return (
    <div className="searchbox" style={{ width }}>
      <IconSearch size={15} className="searchbox__icon" />
      <input className="searchbox__input" value={value} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)} />
    </div>
  )
}
