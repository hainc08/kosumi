import { useMemo, useState } from 'react'
import { IconBuildingStore, IconFileInvoice, IconCurrencyDong, IconPlus } from '@tabler/icons-react'
import { CUSTOMER_TYPE_LABELS, type Customer, type CustomerType } from '@/types'
import { useCustomers } from '@/api/customers'
import { formatCurrency } from '@/utils/format'
import { PageShell } from '@/components/layout/PageShell'
import { KpiCard } from '@/components/ui/KpiCard'
import { DataTable, type Column } from '@/components/ui/DataTable'
import { SearchBox } from '@/components/ui/SearchBox'
import { FilterSelect } from '@/components/ui/FilterSelect'
import { Button } from '@/components/ui/Button'
import { CustomerForm } from '@/components/customers/CustomerForm'
import { CustomerDetailDrawer } from '@/components/customers/CustomerDetailDrawer'
import './Customers.css'

export default function CustomersPage() {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [selected, setSelected] = useState<Customer | null>(null)

  const { data: all = [] } = useCustomers({})
  const { data: customers = [], isLoading } = useCustomers({ search, type })

  const kpis = useMemo(() => ({
    total: all.length,
    withQuotes: all.filter((c) => (c.quoteCount ?? 0) > 0).length,
    value: all.reduce((s, c) => s + (c.totalContractValue ?? 0), 0),
  }), [all])

  const columns: Column<Customer>[] = [
    {
      key: 'name', header: 'Khách hàng',
      render: (c) => (
        <div className="cell-cust">
          <div className="cell-cust__name">{c.name}</div>
          <div className="cell-cust__code">{c.code}</div>
        </div>
      ),
    },
    { key: 'type', header: 'Loại', render: (c) => CUSTOMER_TYPE_LABELS[c.type] },
    {
      key: 'contact', header: 'Liên hệ chính',
      render: (c) => c.primaryContact ? (
        <div><div>{c.primaryContact.fullName}</div><div className="cell-cust__sub">{c.primaryContact.phone ?? ''}</div></div>
      ) : '—',
    },
    { key: 'projects', header: 'Dự án', align: 'center', render: (c) => c.projectCount ?? 0 },
    { key: 'quotes', header: 'Báo giá', align: 'center', render: (c) => c.quoteCount ?? 0 },
    { key: 'value', header: 'Tổng giá trị', align: 'right', render: (c) => formatCurrency(c.totalContractValue ?? 0) },
    { key: 'industry', header: 'Ngành nghề', render: (c) => c.industry || '—' },
  ]

  const openAdd = () => { setEditing(null); setFormOpen(true) }
  const openEdit = (c: Customer) => { setSelected(null); setEditing(c); setFormOpen(true) }

  return (
    <PageShell
      title="Khách hàng" subtitle="Quản lý đối tác"
      actions={<Button variant="primary" icon={<IconPlus size={15} />} onClick={openAdd}>Thêm khách hàng</Button>}
    >
      <div className="kpi-row">
        <KpiCard label="Tổng khách hàng" value={kpis.total} icon={<IconBuildingStore size={16} />} iconColor="var(--color-blue)" />
        <KpiCard label="Có báo giá" value={kpis.withQuotes} icon={<IconFileInvoice size={16} />} iconColor="var(--color-green)" />
        <KpiCard label="Tổng giá trị HĐ" value={formatCurrency(kpis.value)} icon={<IconCurrencyDong size={16} />} iconColor="var(--color-purple)" />
      </div>

      <div className="toolbar">
        <SearchBox value={search} onChange={setSearch} placeholder="Tìm tên, mã, MST, liên hệ..." width="260px" />
        <FilterSelect value={type} onChange={setType} placeholder="Tất cả loại"
          options={(Object.keys(CUSTOMER_TYPE_LABELS) as CustomerType[]).map((k) => ({ value: k, label: CUSTOMER_TYPE_LABELS[k] }))} />
      </div>

      <DataTable
        columns={columns} data={customers} loading={isLoading} rowKey={(c) => c.id}
        onRowClick={(c) => setSelected(c)} emptyText="Không tìm thấy khách hàng"
      />

      <CustomerForm open={formOpen} customer={editing} onClose={() => setFormOpen(false)} />
      <CustomerDetailDrawer customer={selected} open={!!selected} onClose={() => setSelected(null)} onEdit={openEdit} />
    </PageShell>
  )
}
