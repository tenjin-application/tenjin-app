import express from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
    const result = await pool.query(
        `SELECT g.id, g.name, g.meeting_mode, g.chat_url, c.code AS course_code
        FROM group_members gm
        JOIN groups g ON g.id = gm.group_id
        LEFT JOIN courses c ON c.id = g.course_id
        WHERE gm.user_id = $1
        ORDER BY g.name, g.id`,
        [req.session.userId]
    );

    return res.json({ groups: result.rows });
});

export default router;
