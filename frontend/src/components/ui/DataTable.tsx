import './DataTable.css'
import { LoadingSkeleton } from './LoadingSkeleton'

export interface Column<T> {
  key: string; header: string; width?: string; align?: 'left' | 'right' | 'center'
  render?: (row: T) => React.ReactNode
}
interface DataTableProps<T> {
  columns: Column<T>[]; data: T[]; loading?: boolean
  onRowClick?: (row: T) => void; emptyText?: string; rowKey: (row: T) => string
}

export function DataTable<T>({ columns, data, loading, onRowClick, emptyText = 'Chưa có dữ liệu', rowKey }: DataTableProps<T>) {
  return (
    <div className="dtable__wrap">
      <table className="dtable">
        <thead>
          <tr>{columns.map((c) => <th key={c.key} style={{ width: c.width, textAlign: c.align }}>{c.header}</th>)}</tr>
        </thead>
        <tbody>
          {loading ? (
            <tr><td colSpan={columns.length}><LoadingSkeleton rows={3} columns={columns.length} /></td></tr>
          ) : data.length === 0 ? (
            <tr><td colSpan={columns.length} className="dtable__empty">{emptyText}</td></tr>
          ) : data.map((row) => (
            <tr key={rowKey(row)} className={onRowClick ? 'dtable__row--click' : ''} onClick={() => onRowClick?.(row)}>
              {columns.map((c) => (
                <td key={c.key} style={{ textAlign: c.align }}>
                  {c.render ? c.render(row) : String((row as Record<string, unknown>)[c.key] ?? '')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
