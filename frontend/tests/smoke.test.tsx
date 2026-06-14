import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'

describe('Sidebar', () => {
  it('render các nhóm menu và mục Công nhân', () => {
    render(<MemoryRouter><Sidebar /></MemoryRouter>)
    expect(screen.getByText('Công nhân')).toBeInTheDocument()
    expect(screen.getByText('Báo giá')).toBeInTheDocument()
    expect(screen.getByText('Sản xuất')).toBeInTheDocument()
  })
})
