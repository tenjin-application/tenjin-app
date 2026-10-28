import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import pgSession from 'connect-pg-simple'
import pg from 'pg'

export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const app = express()
app.use(express.json())

const PgStore = pgSession(session)
app.use(session({
    store: new PgStore({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 },
}))

app.get('/api/health', async (_req, res) => {
    const { rows } = await pool.query('select now()')
    res.json({ ok: true, time: rows[0].now })
})

app.listen(3000, () => console.log('API on http://localhost:3000'))