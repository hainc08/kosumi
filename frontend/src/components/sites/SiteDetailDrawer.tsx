import { IconEdit } from '@tabler/icons-react'
import { SITE_TYPE_LABELS, SITE_STATUS_LABELS, type Site, type SiteStatus } from '@/types'
import { DetailDrawer } from '@/components/ui/DetailDrawer'
import { Badge, type BadgeVariant } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import './SiteDetailDrawer.css'

export const SITE_STATUS_VARIANT: Record<SiteStatus, BadgeVariant> = {
  active: 'green', paused: 'amber', preparing: 'blue',
}

interface Props { site: Site | null; open: boolean; onClose: () => void; onEdit: (s: Site) => void }

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="sd-row"><span className="sd-row__label">{label}</span><span className="sd-row__value">{value || '—'}</span></div>
}

export function SiteDetailDrawer({ site, open, onClose, onEdit }: Props) {
  if (!site) return null
  return (
    <DetailDrawer
      open={open} onClose={onClose} title="Chi tiết công trường / xưởng"
      actions={<Button variant="primary" icon={<IconEdit size={15} />} onClick={() => onEdit(site)}>Chỉnh sửa</Button>}
    >
      <div className="sd-head">
        <div>
          <div className="sd-name">{site.name}</div>
          <div className="sd-code">{site.code} · {SITE_TYPE_LABELS[site.type]}</div>
        </div>
        <Badge variant={SITE_STATUS_VARIANT[site.status]} dot>{SITE_STATUS_LABELS[site.status]}</Badge>
      </div>

      <div className="sd-stats">
        <div className="sd-stat"><span>Nhân viên</span><strong>{site.workerCount ?? 0}</strong></div>
        <div className="sd-stat"><span>Dự án</span><strong>{site.projectCount ?? 0}</strong></div>
        <div className="sd-stat"><span>Diện tích</span><strong>{site.areaM2 ? `${site.areaM2} m²` : '—'}</strong></div>
      </div>

      <div className="sd-section">Thông tin</div>
      <Row label="Khu công nghiệp" value={site.industrialZone} />
      <Row label="Địa chỉ" value={site.address} />
      <Row label="Tỉnh / Thành phố" value={site.city} />
      <Row label="Điện thoại" value={site.phone} />
      <Row label="Phụ trách" value={site.managerName} />
      {site.notes && <Row label="Ghi chú" value={site.notes} />}
    </DetailDrawer>
  )
}
