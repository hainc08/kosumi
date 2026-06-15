import { makeCode } from '../../src/common/utils/code.util'

describe('makeCode', () => {
  it('pads sequence to width', () => {
    expect(makeCode('CS', 1)).toBe('CS001')
    expect(makeCode('CN', 42)).toBe('CN042')
    expect(makeCode('CS', 1, 4)).toBe('CS0001')
  })
})
