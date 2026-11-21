import express from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';

const router = express.Router();

router.patch('/notifications/:id/read', requireAuth, async (req, res) => {
    const notificationId = Number(req.params.id);
    if (!Number.isInteger(notificationId) || notificationId < 1) {
        return res.status(400).json({ error: 'Notification id must be a positive integer.' });
    }

    const result = await pool.query(
        `UPDATE notifications SET read_at = COALESCE(read_at, NOW())
        WHERE id = $1 AND user_id = $2
        RETURNING id, read_at`,
        [notificationId, req.session.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Notification not found.' });

    return res.json({ notification: result.rows[0] });
});

router.delete('/notifications/:id', requireAuth, async (req, res) => {
    const notificationId = Number(req.params.id);
    if (!Number.isInteger(notificationId) || notificationId < 1) {
        return res.status(400).json({ error: 'Notification id must be a positive integer.' });
    }

    const result = await pool.query(
        'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
        [notificationId, req.session.userId]
    );
    if (result.rowCount === 0) return res.status(404).json({ error: 'Notification not found.' });

    return res.json({ deleted: true });
});

router.delete('/notifications', requireAuth, async (req, res) => {
    const result = await pool.query(
        'DELETE FROM notifications WHERE user_id = $1',
        [req.session.userId]
    );

    return res.json({ deleted: result.rowCount });
});

router.get('/', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    const [groupsResult, notificationsResult, requestsResult] = await Promise.all([
        pool.query(
        `SELECT g.id, g.name, g.owner_id = $1 AS is_owner,
                g.meeting_mode, g.chat_url, c.code AS course_code
        FROM group_members gm
        JOIN groups g ON g.id = gm.group_id
        LEFT JOIN courses c ON c.id = g.course_id
        WHERE gm.user_id = $1
        ORDER BY g.name, g.id`,
            [userId]
        ),
        pool.query(
            `SELECT n.id, n.type, n.read_at, n.created_at,
                    g.name AS group_name, actor.display_name AS actor_name
            FROM notifications n
            LEFT JOIN groups g ON g.id = n.group_id
            LEFT JOIN users actor ON actor.id = n.actor_id
            WHERE n.user_id = $1
            ORDER BY n.created_at DESC, n.id DESC`,
            [userId]
        ),
        pool.query(
            `SELECT jr.id, jr.group_id, jr.message, jr.created_at,
                    g.name AS group_name, requester.display_name AS requester_name
            FROM join_requests jr
            JOIN groups g ON g.id = jr.group_id
            JOIN users requester ON requester.id = jr.user_id
            WHERE g.owner_id = $1 AND jr.status = 'pending'
            ORDER BY jr.created_at DESC, jr.id DESC`,
            [userId]
        ),
    ]);

    return res.json({
        groups: groupsResult.rows,
        notifications: notificationsResult.rows,
        requests: requestsResult.rows,
    });
});

export default router;