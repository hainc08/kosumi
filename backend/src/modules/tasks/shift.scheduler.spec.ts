import { ShiftScheduler } from './shift.scheduler'

describe('ShiftScheduler', () => {
  it('tick gọi sweepExpiredOvertime mỗi phút', () => {
    jest.useFakeTimers()
    const svc = { sweepExpiredOvertime: jest.fn().mockResolvedValue({ ended: 0 }), endOfShiftClockOut: jest.fn().mockResolvedValue({ ended: 0 }) }
    const s = new ShiftScheduler(svc as never)
    s.onModuleInit()
    jest.advanceTimersByTime(60_000)
    expect(svc.sweepExpiredOvertime).toHaveBeenCalled()
    s.onModuleDestroy()
    jest.useRealTimers()
  })
})
