import jwt from 'jsonwebtoken'

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET  || 'viva_access_secret_change_in_prod'
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'viva_refresh_secret_change_in_prod'

export interface JWTPayload {
  userId: string
  handle: string
}

export function signAccess(payload: JWTPayload): string {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '15m' })
}

export function signRefresh(payload: JWTPayload): string {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '30d' })
}

export function verifyAccess(token: string): JWTPayload {
  return jwt.verify(token, ACCESS_SECRET) as JWTPayload
}

export function verifyRefresh(token: string): JWTPayload {
  return jwt.verify(token, REFRESH_SECRET) as JWTPayload
}
