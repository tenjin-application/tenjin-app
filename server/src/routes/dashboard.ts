// THIS IS JUST A TEMPORARY ROUTER, SWAP ACCORDINGLY.

import express from 'express';
import { pool } from '../db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { isSafeUrl } from '../../../shared/validation.js';

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

router.get('/groups/:id/members', requireAuth, async (req, res) => {
    const groupId = Number(req.params.id);
    if (!Number.isInteger(groupId) || groupId < 1) {
        return res.status(400).json({ error: 'Group id must be a positive integer.' });
    }

    const membersResult = await pool.query(
        `SELECT u.id, u.display_name, gm.role
        FROM groups g
        JOIN group_members gm ON gm.group_id = g.id
        JOIN users u ON u.id = gm.user_id
        WHERE g.id = $1
          AND EXISTS (
              SELECT 1
              FROM group_members viewer
              WHERE viewer.group_id = g.id AND viewer.user_id = $2
          )
        ORDER BY CASE WHEN gm.role = 'owner' THEN 0 ELSE 1 END, u.display_name NULLS LAST, u.id`,
        [groupId, req.session.userId]
    );
    if (membersResult.rowCount === 0) {
        return res.status(404).json({ error: 'Group not found.' });
    }

    return res.json(membersResult.rows);
});

router.patch('/groups/:id', requireAuth, async (req, res, next) => {
    const groupId = Number(req.params.id);
    if (!Number.isInteger(groupId) || groupId < 1) {
        return res.status(400).json({ error: 'Group id must be a positive integer.' });
    }

    const invalid: string[] = [];
    const { name, description, courseId, joinPolicy, capacity, chatUrl, meetingMode } = req.body || {};
    const cleanedName = typeof name === 'string' ? name.trim() : '';
    const cleanedDescription = typeof description === 'string' ? description.trim() || null : description ?? null;
    const cleanedChatUrl = typeof chatUrl === 'string' ? chatUrl.trim() || null : chatUrl ?? null;

    if (cleanedName.length < 3 || cleanedName.length > 60) invalid.push('name');
    if (!(cleanedDescription === null || (typeof cleanedDescription === 'string' && cleanedDescription.length <= 1000))) invalid.push('description');
    if (!(courseId == null || Number.isInteger(courseId))) invalid.push('courseId');
    if (!(joinPolicy === 'open' || joinPolicy === 'request')) invalid.push('joinPolicy');
    if (!(Number.isInteger(capacity) && capacity >= 2 && capacity <= 20)) invalid.push('capacity');
    if (!(cleanedChatUrl === null || (typeof cleanedChatUrl === 'string' && isSafeUrl(cleanedChatUrl)))) invalid.push('chatUrl');
    if (!(meetingMode === 'in_person' || meetingMode === 'online' || meetingMode === 'hybrid')) invalid.push('meetingMode');
    if (invalid.length > 0) return res.status(400).json({ error: 'Some fields are invalid.', fields: invalid });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const groupResult = await client.query(
            'SELECT id, owner_id FROM groups WHERE id = $1 FOR UPDATE',
            [groupId]
        );
        const group = groupResult.rows[0];
        if (!group || group.owner_id !== req.session.userId) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Group not found.' });
        }

        const memberCountResult = await client.query(
            'SELECT COUNT(*)::int AS member_count FROM group_members WHERE group_id = $1',
            [groupId]
        );
        if (capacity < memberCountResult.rows[0].member_count) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Capacity cannot be lower than the current member count.' });
        }

        await client.query(
            `UPDATE groups
            SET name = $1, description = $2, course_id = $3, join_policy = $4,
                capacity = $5, chat_url = $6, meeting_mode = $7
            WHERE id = $8`,
            [cleanedName, cleanedDescription, courseId ?? null, joinPolicy, capacity, cleanedChatUrl, meetingMode, groupId]
        );
        const updatedGroupResult = await client.query(
            `SELECT g.id, g.name, g.description, g.course_id, g.join_policy, g.capacity,
                    g.chat_url, g.meeting_mode, c.code AS course_code
            FROM groups g
            LEFT JOIN courses c ON c.id = g.course_id
            WHERE g.id = $1`,
            [groupId]
        );

        await client.query('COMMIT');
        return res.json(updatedGroupResult.rows[0]);
    } catch (err: any) {
        await client.query('ROLLBACK');
        if (err.code === '23503') return res.status(400).json({ error: "That course doesn't exist." });
        return next(err);
    } finally {
        client.release();
    }
});

router.get('/', requireAuth, async (req, res) => {
    const userId = req.session.userId;
    const [groupsResult, notificationsResult, requestsResult] = await Promise.all([
        pool.query(
        `SELECT g.id, g.name, g.owner_id = $1 AS is_owner,
                g.description, g.course_id, g.join_policy, g.capacity,
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