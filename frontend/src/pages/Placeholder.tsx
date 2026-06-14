import { PageShell } from '@/components/layout/PageShell'
import './Placeholder.css'

export default function Placeholder({ title }: { title: string }) {
  return (
    <PageShell title={title} subtitle="Đang phát triển">
      <div className="placeholder"><p>🚧 Module "{title}" sẽ được xây dựng ở phase sau.</p></div>
    </PageShell>
  )
}
