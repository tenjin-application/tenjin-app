import 'dotenv/config';
import path from 'node:path';

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

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) app.set('trust proxy', 1);

const PgStore = pgSession(session);
app.use(session({
    store: new PgStore({ pool, createTableIfMissing: true }),
    secret: process.env.SESSION_SECRET!,
    resave: false,
    saveUninitialized: false,
    cookie: { 
      httpOnly: true, 
      sameSite: 'lax', 
      maxAge: 1000 * 60 * 60 * 24 * 7 ,
      secure: isProduction
    }
}));

app.get('/api/health', async (_req, res) => {
    const { rows } = await pool.query('select now()');
    res.json({ ok: true, time: rows[0].now });
});

app.use('/api/auth', authRoutes);
app.use('/api/groups', groupsRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/dashboard', dashboardRoutes);

if (isProduction) {
    const clientDist = path.resolve(import.meta.dirname, '../../client/dist');

    // Unknown API paths get a JSON 404, not the React page.
    app.use('/api', (req, res) => res.status(404).json({ error: 'Not found' }));

    // The built files (JS, CSS, images).
    app.use(express.static(clientDist));

    // Any other path is a React route like /groups: send index.html and let React Router handle it.
    app.use((req, res) => res.sendFile(path.join(clientDist, 'index.html')));
}

// Because uncaught Express errors return HTML (because of legacy), this prevents a nonsensical error that would say that the JSON failed to be parsed.
app.use((err: unknown, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
});

const PORT = Number(process.env.PORT) || 3000;
app.listen(PORT, () => console.log(`API on port ${PORT}`));