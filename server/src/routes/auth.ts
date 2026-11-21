import express from 'express';
import crypto from 'node:crypto';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { sendLoginCode } from '../mailer.js';
const router = express.Router();

// Hash helper function.
const hash = (code: string) => crypto.createHash('sha256').update(code).digest('hex');

router.post('/request-code', async (req, res) => {
    const { email } = req.body ?? {};

    // Clean the email before using.
    const cleanedEmail = typeof email === 'string' ? email.trim().toLowerCase() : "";
    
    // If the email is not clean, return an error.
    if (!cleanedEmail) return res.status(400).json({ error: "An invalid email was provided."});
    
    const ontarioTechEmailRegex = /^[a-z0-9._%+-]+@ontariotechu\.net$/;
    if (!ontarioTechEmailRegex.test(cleanedEmail)) return res.status(400).json({ error: "Emails must end with '@ontariotechu.net'." });

    // Queries the database to see how many login attempts were made in the last 10 minutes (by a given email).
    const countResult = await pool.query(
        "SELECT COUNT(*)::INT FROM login_codes WHERE email = $1 AND created_at >= NOW() - INTERVAL '10 minutes'",
        [cleanedEmail]
    );
    const recentCount = countResult.rows[0].count;

    // If the count is greater or equal to 3, return an error object informing the user (they are being rate limited).
    if (recentCount >= 3) return res.status(429).json({ error: 'Too many email codes, please try again in 10 minutes.' });

    // Generate our code hash.
    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = hash(code);

    // Insert the code into the login_codes table of the database.
    await pool.query(
        "INSERT INTO login_codes (email, code_hash, expires_at) VALUES($1, $2, NOW() + INTERVAL '10 minutes')",
        [cleanedEmail, codeHash]
    );

    // Send the email for the code if in production, otherwise send the console statement.
    if (process.env.NODE_ENV === 'production') {
        await sendLoginCode(cleanedEmail, code);
    } else {
        console.log(`[dev] code for ${cleanedEmail}: ${code}`);
    }
    return res.json({ ok: true });
});

router.post('/verify', async (req, res, next) => {
    const { email, code } = req.body ?? {};

    // Cleans both the email and code.
    const cleanedEmail = typeof email === 'string' ? email.trim().toLowerCase() : "";
    const cleanedCode = typeof code === 'string' ? code.trim() : "";
    
    // Construct a regex for the code, before testing it.
    const codeRegex = /^\d{6}$/;
    if (!codeRegex.test(cleanedCode)) return res.status(400).json({ error: "Your code must be exactly 6 digits." });

    // Obtains the most recent code that has yet to be expired, and is not used.
    const codeResult = await pool.query(
        `SELECT id, code_hash
        FROM login_codes 
        WHERE email = $1 AND expires_at > NOW() AND used_at IS NULL 
        ORDER BY created_at DESC 
        LIMIT 1`,
        [cleanedEmail]
    );
    const recentCode = codeResult.rows[0];
    
    // If there's no recent code, it means that it has either expired, or is invalid.
    if (!recentCode) return res.status(400).json({ error: "Code expired or invalid."} );
    
    // Update the attempt number from the database. If nothing is returned it means that the user already has done too many requests.
    const attemptResult = await pool.query(
        'UPDATE login_codes SET attempts = attempts + 1 WHERE id = $1 AND attempts < 5',
        [recentCode.id]
    );

    if (attemptResult.rowCount === 0) {
        return res.status(429).json({ error: "Too many attempts. Please request a new code." });
    }
    
    // We compare the user-provided code, with the hashed code.
    const a = Buffer.from(hash(cleanedCode), 'hex');
    const b = Buffer.from(recentCode.code_hash, 'hex');
    const matches = a.length === b.length && crypto.timingSafeEqual(a, b);

    // If the code doesn't match, return an error.
    if (!matches) {
        return res.status(400).json({ error: "Provided code does not match." });
    }

    // Since it matches, we now set the code as having been used, AND check that used_at was already null.
    const claimResult = await pool.query(
        'UPDATE login_codes SET used_at = NOW() WHERE id = $1 AND used_at IS NULL',
        [recentCode.id]
    );

    // If we don't have any rows changed, we know we have an invalid code of sorts.
    if (claimResult.rowCount === 0) return res.status(400).json({ error: "Code expired or invalid." });

    // Find or create a new user.
    const userResult = await pool.query(
        `INSERT INTO users (email) VALUES($1) 
        ON CONFLICT (email) DO UPDATE SET email = EXCLUDED.email 
        RETURNING id, onboarded_at`,
        [cleanedEmail]
    );
    const userRow = userResult.rows[0];

    // Regenerates the session cookie, irregardless of what was placed there prior.
    // Catches errors, before setting the user id, effectively creating a session, before returning an object informing of any prior onboarding.
    req.session.regenerate((err) => {
        if (err) return next(err);
        req.session.userId = userRow.id;
        res.json({ onboarded: userRow.onboarded_at !== null });
    });
});

router.get('/me', requireAuth, async (req, res, next) => {
    // Obtain the user id corresponding to the session, before looking it up in our users database.
    const userId = req.session.userId;
    const userResult = await pool.query(
        `SELECT id, email, display_name, program, year, bio, study_style, group_size_min, group_size_max, onboarded_at 
        FROM users WHERE id = $1`,
        [userId]
    );
    const userRow = userResult.rows[0];

    // If there's no user, destroy the session and return a 401.
    // Note: We could technically also clear out the sid, but it's not really needed here anyways.
    if (!userRow) {
        return req.session.destroy((err) => {
            if (err) return next(err);
            return res.status(401).json({ error: "User not found." });
        });
    }

    // Otherwise, return the user info to the client.
    return res.json({ user: userRow })
});

router.post('/logout', (req, res, next) => {
    // Destroys the session, clears the sid, and returns ok.
    req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        return res.json({ ok: true });
    });
});

export default router;