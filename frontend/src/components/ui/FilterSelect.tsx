import './FilterSelect.css'

interface Opt { value: string; label: string }
interface FilterSelectProps { options: Opt[]; value: string; onChange: (v: string) => void; placeholder?: string; width?: string }

export function FilterSelect({ options, value, onChange, placeholder, width }: FilterSelectProps) {
  return (
    <select className="filter-select" style={{ width }} value={value} onChange={(e) => onChange(e.target.value)}>
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}
