import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { isValidAdminToken } from './admin-auth'

const ORIGINAL_TOKEN = process.env.ADMIN_SECRET_TOKEN

beforeEach(() => {
  process.env.ADMIN_SECRET_TOKEN = 'correct-token'
})

afterEach(() => {
  process.env.ADMIN_SECRET_TOKEN = ORIGINAL_TOKEN
})

describe('isValidAdminToken', () => {
  it('returns true for the configured token', () => {
    expect(isValidAdminToken('correct-token')).toBe(true)
  })

  it('returns false for any other value', () => {
    expect(isValidAdminToken('guess')).toBe(false)
  })
})
