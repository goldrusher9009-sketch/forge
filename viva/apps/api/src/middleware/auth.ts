import { Request, Response, NextFunction } from 'express'
import { verifyAccess } from '../lib/jwt'

export interface AuthRequest extends Request {
  userId?: string
  userHandle?: string
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing token' })
  }
  const token = header.slice(7)
  try {
    const payload = verifyAccess(token)
    req.userId = payload.userId
    req.userHandle = payload.handle
    next()
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' })
  }
}

export function optionalAuth(req: AuthRequest, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (header?.startsWith('Bearer ')) {
    try {
      const payload = verifyAccess(header.slice(7))
      req.userId = payload.userId
      req.userHandle = payload.handle
    } catch { /* ignore */ }
  }
  next()
}
