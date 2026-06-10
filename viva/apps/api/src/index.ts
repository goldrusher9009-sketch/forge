import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { createServer } from 'http'
import dotenv from 'dotenv'
import rateLimit from 'express-rate-limit'

import authRouter from './routes/auth'
import usersRouter from './routes/users'
import feedRouter from './routes/feed'
import messagesRouter from './routes/messages'
import marketsRouter from './routes/markets'
import healthRouter from './routes/health'
import tokensRouter from './routes/tokens'
import roomsRouter from './routes/rooms'
import twinRouter from './routes/twin'
import datingRouter from './routes/dating'
import { setupWebSocket } from './ws/server'
import { errorHandler } from './middleware/error'

dotenv.config()

const app = express()
const httpServer = createServer(app)

// ── Middleware ──────────────────────────────────────────
app.use(helmet())
app.use(cors({
  origin: (origin, cb) => {
    const allowed = (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map(s => s.trim())
    if (!origin || allowed.some(a => origin.startsWith(a))) return cb(null, true)
    cb(new Error('CORS'))
  },
  credentials: true,
}))
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 500,
  standardHeaders: true,
  legacyHeaders: false,
})
app.use(limiter)

// ── Health check ─────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', version: '0.1.0', ts: new Date().toISOString() })
})

// ── Routes ───────────────────────────────────────────
app.use('/api/auth',    authRouter)
app.use('/api/users',   usersRouter)
app.use('/api/feed',    feedRouter)
app.use('/api/messages', messagesRouter)
app.use('/api/markets', marketsRouter)
app.use('/api/health',  healthRouter)
app.use('/api/tokens',  tokensRouter)
app.use('/api/rooms',   roomsRouter)
app.use('/api/twin',    twinRouter)
app.use('/api/dating',  datingRouter)

// ── Error handler ────────────────────────────────────
app.use(errorHandler)

// ── WebSocket ────────────────────────────────────────
setupWebSocket(httpServer)

// ── Start ────────────────────────────────────────────
const PORT = process.env.PORT || 4000
httpServer.listen(PORT, () => {
  console.log(`🚀 VIVA API running on http://localhost:${PORT}`)
})

export default app
