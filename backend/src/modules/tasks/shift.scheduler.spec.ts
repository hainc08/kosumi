import { ShiftScheduler } from './shift.scheduler'

describe('ShiftScheduler', () => {
  it('tick gọi sweepExpiredOvertime và sweepStaleAssignments', async () => {
    const svc = { sweepExpiredOvertime: jest.fn().mockResolvedValue({ ended: 0 }), sweepStaleAssignments: jest.fn().mockResolvedValue({ ended: 0 }) }
    const s = new ShiftScheduler(svc as never)
    await s.tick(new Date())
    expect(svc.sweepExpiredOvertime).toHaveBeenCalled()
    expect(svc.sweepStaleAssignments).toHaveBeenCalled()
  })
})
