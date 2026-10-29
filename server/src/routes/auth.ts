import express from 'express';
import crypto from 'node:crypto';
import { pool } from '../db.js';
const router = express.Router();

// Hash helper functions
const hash = (code: string) => crypto.createHash('sha256').update(code).digest('hex');

router.post('/request-code', async (req, res) => {
    // Gather the email from the request body, before cleaning it.
    const { email } = req.body;
    const cleanedEmail = typeof email === 'string' ? email.trim().toLowerCase() : "";
    
    // If our cleaned email isn't valid, inform the user.
    if (!cleanedEmail) return res.status(400).json({ error: "An invalid email was provided."});

    // If our cleaned email contains the correct Ontario Tech email address.
    const ontarioTechEmailRegex = /^[a-z0-9._%+-]+@ontariotechu\.net$/;
    if (!ontarioTechEmailRegex.test(cleanedEmail)) return res.status(400).json({ error: "Emails must end with 'ontariotechu.net'." });

    // Queries the database to see how many login attempts were made in the last 10 minutes (by a given email).
    const countResult = await pool.query(
        "SELECT COUNT(*)::int FROM login_codes WHERE email = $1 AND created_at >= NOW() - INTERVAL '10 minutes'",
        [cleanedEmail]
    );
    const recentCount = countResult.rows[0].count;

    // If the count is greater or equal to 3, return an error object informing the user (they are being rate limited).
    if (recentCount >= 3) {
        return res.status(429).json({ error: 'Too many email codes, please try again in 10 minutes.' });
    }

    // Generate our code hash.
    const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = hash(code);

    // Insert the code into the login_codes table of the database.
    await pool.query(
        "INSERT INTO login_codes (email, code_hash, expires_at) VALUES($1, $2, NOW() + INTERVAL '10 minutes')",
        [cleanedEmail, codeHash]
    );

    // Log the code (for now), and return a success response.
    console.log(`[dev] code for ${cleanedEmail}: ${code}`);
    return res.json({ ok: true });
});

export default router;