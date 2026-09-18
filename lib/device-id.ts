const DEVICE_ID_KEY = 'audience-qa-device-id'

export function getDeviceId(): string {
  const existing = window.localStorage.getItem(DEVICE_ID_KEY)
  if (existing) {
    return existing
  }
  const id = crypto.randomUUID()
  window.localStorage.setItem(DEVICE_ID_KEY, id)
  return id
}
