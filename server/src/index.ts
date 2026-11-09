import 'dotenv/config';
import { pool } from './db.js';
import express from 'express';
import session from 'express-session';
import pgSession from 'connect-pg-simple';

import authRoutes from './routes/auth.js';
import groupsRoutes from './routes/groups.js';
import courseRoutes from './routes/courses.js';
import onboardingRoutes from './routes/onboarding.js';
import dashboardRoutes from './routes/dashboard.js';

const app = express();
app.use(express.json());

const PgStore = pgSession(session);
app.use(session({
    store: new PgStore({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 },
}));

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.get('/api/health', async (_req, res) => {
    const { rows } = await pool.query('select now()')
    res.json({ ok: true, time: rows[0].now })
});

app.listen(3000, () => console.log('API on http://localhost:3000'));