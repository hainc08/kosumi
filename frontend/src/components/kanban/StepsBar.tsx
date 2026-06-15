import { IconCheck } from '@tabler/icons-react'

const LABELS = ['Công trường', 'Dự án', 'Báo giá', 'Phân công']

interface StepsBarProps { step: number; onJump: (step: number) => void }

export function StepsBar({ step, onJump }: StepsBarProps) {
  return (
    <div className="steps-bar">
      {LABELS.map((label, i) => {
        const n = i + 1
        const done = n < step
        const active = n === step
        return (
          <div key={n} className="steps-bar__group">
            <div
              className={`step-item ${done ? 'step-item--done' : ''} ${active ? 'step-item--active' : ''}`}
              onClick={() => done && onJump(n)}
              title={done ? `Quay lại bước ${n}` : ''}
            >
              <span className="step-item__num">{done ? <IconCheck size={13} /> : n}</span>
              <span className="step-item__label">{label}</span>
            </div>
            {i < LABELS.length - 1 && <div className={`step-sep ${done ? 'step-sep--done' : ''}`} />}
          </div>
        )
      })}
    </div>
  )
}
