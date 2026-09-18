import { describe, it, expect, beforeEach } from 'vitest'
import { getDeviceId } from './device-id'

beforeEach(() => {
  window.localStorage.clear()
})

describe('getDeviceId', () => {
  it('generates and persists a device id on first call', () => {
    const id = getDeviceId()
    expect(id).toBeTruthy()
    expect(window.localStorage.getItem('audience-qa-device-id')).toBe(id)
  })

  it('returns the same id on subsequent calls', () => {
    const first = getDeviceId()
    const second = getDeviceId()
    expect(second).toBe(first)
  })
})
