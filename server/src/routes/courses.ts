import express from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import type { Course } from '../../../shared/types.js';

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
    // Query and store all of the courses, before returning (God why can't all routes be this easy?).
    const coursesResult = await pool.query<Course>(
        'SELECT id::INT AS id, code, title FROM courses ORDER BY code'
    );
    return res.json(coursesResult.rows);
});

export default router;