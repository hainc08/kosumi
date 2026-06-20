import { formatCurrency } from '@/utils/format'

interface Props { data: { label: string; value: number }[]; color?: string }

/** Biểu đồ cột doanh thu bằng SVG thuần (không thư viện ngoài). */
export function RevenueBarChart({ data, color = 'var(--color-blue)' }: Props) {
  const max = Math.max(1, ...data.map((d) => d.value))
  const W = 680, H = 200, padX = 8, padTop = 12, padBottom = 24
  const bw = (W - padX * 2) / Math.max(1, data.length)
  const plotH = H - padTop - padBottom
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="rev-chart" role="img">
      <line x1={padX} y1={H - padBottom} x2={W - padX} y2={H - padBottom} className="rev-chart__axis" />
      {data.map((d, i) => {
        const h = (d.value / max) * plotH
        const x = padX + i * bw + bw * 0.18
        const y = H - padBottom - h
        const w = bw * 0.64
        return (
          <g key={i}>
            <rect x={x} y={y} width={w} height={Math.max(0, h)} rx={3} fill={color}>
              <title>{`${d.label}: ${formatCurrency(d.value)}`}</title>
            </rect>
            <text x={x + w / 2} y={H - padBottom + 14} textAnchor="middle" className="rev-chart__lbl">{d.label}</text>
          </g>
        )
      })}
    </svg>
  )
}
