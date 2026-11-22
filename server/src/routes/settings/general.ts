import express from 'express';
import { pool } from '../../db.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { PROGRAMS } from '../../../../shared/programs.js';

const router = express.Router();

router.delete('/', requireAuth, async (req, res) => {
    const userId = req.session.userId;

    const result = await pool.query(
        'DELETE FROM users WHERE id = $1',
        [userId]
    );
    console.log(`${result}`);
    return res.json({ deleted: true });
})

export default router;