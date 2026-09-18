export function isValidAdminToken(token: string): boolean {
  const expected = process.env.ADMIN_SECRET_TOKEN
  return Boolean(expected) && token === expected
}
