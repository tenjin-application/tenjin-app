import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { isSafeUrl } from '../../../shared/validation.js';
import { pool } from '../db.js';

import type { Me } from '../ranking.js';
import { scoreGroup } from '../ranking.js';

const router = express.Router();
const MAX_OWNED_GROUPS = 5;

router.post('/', requireAuth, async (req, res, next) => {
    const invalid: string[] = [];
    const { name, description, courseId, joinPolicy, capacity, chatUrl, meetingMode } = req.body || {};
    const userId = req.session.userId;

    // Handles any malformed requests.
    if (!name || !joinPolicy || !capacity || !meetingMode) return res.status(400).json({ error: "Malformed response." });

    // Clean free-text fields first. Non-strings are left alone so validation can reject them.
    const cleanedName = typeof name === 'string' ? name.trim() : '';
    const cleanedDescription = typeof description === 'string' ? description.trim() || null : description ?? null;
    const cleanedChatUrl = typeof chatUrl === 'string' ? chatUrl.trim() || null : chatUrl ?? null;

    // Following is a series of validations, any that are invalid are pushed to the invalid array.
    const isValidName = cleanedName.length >= 3 && cleanedName.length <= 60;
    if (!isValidName) invalid.push('name');

    const isValidDescription = cleanedDescription === null || (typeof cleanedDescription === 'string' && cleanedDescription.length <= 1000);
    if (!isValidDescription) invalid.push('description');

    const isValidCourseId = courseId == null || Number.isInteger(courseId);
    if (!isValidCourseId) invalid.push('courseId');

    const isValidJoinPolicy = joinPolicy === 'open' || joinPolicy === 'request';
    if (!isValidJoinPolicy) invalid.push('joinPolicy');

    const isValidCapacity = Number.isInteger(capacity) && capacity >= 2 && capacity <= 20;
    if (!isValidCapacity) invalid.push('capacity');

    const isValidChatUrl = cleanedChatUrl === null || (typeof cleanedChatUrl === 'string' && isSafeUrl(cleanedChatUrl));
    if (!isValidChatUrl) invalid.push('chatUrl');

    const isValidMeetingMode = meetingMode === 'in_person' || meetingMode === 'online' || meetingMode === 'hybrid';
    if (!isValidMeetingMode) invalid.push('meetingMode');

    // If any number of inputs are invalid, reply with a response and return.
    if (invalid.length > 0) return res.status(400).json({ error: "Some fields are invalid.", fields: invalid });

    // Limit how many groups one student can own at a time.
    const groupLimitResult = await pool.query(
        "SELECT COUNT(*)::int AS count FROM groups WHERE owner_id = $1",
        [userId]
    );
    if (groupLimitResult.rows[0].count >= MAX_OWNED_GROUPS) {
        return res.status(403).json({ error: `You can own at most ${MAX_OWNED_GROUPS} groups.` });
    }

    // The group and its owner membership must be created together, or a group could exist with no owner.
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const groupResult = await client.query(
            `INSERT INTO groups (name, description, course_id, owner_id, join_policy, capacity, chat_url, meeting_mode)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *`,
            [cleanedName, cleanedDescription, courseId ?? null, userId, joinPolicy, capacity, cleanedChatUrl, meetingMode]
        );
        const group = groupResult.rows[0];

        await client.query(
            `INSERT INTO group_members (group_id, user_id, role)
            VALUES ($1, $2, 'owner')`,
            [group.id, userId]
        );

        await client.query('COMMIT');
        return res.status(201).json(group);
    } catch (err: any) {
        await client.query('ROLLBACK');

        // Foreign key violation: most likely a course id that doesn't exist.
        if (err.code === '23503') return res.status(400).json({ error: "That course doesn't exist." });
        return next(err);
    } finally {
        client.release();
    }
});

router.get('/', requireAuth, async (req, res) => {
    // We get the userId from the session.
    const userId = req.session.userId;
    
    // This one's a doozy, but put simply, it returns all relevant information about a group,
    // Subqueries the member count, whether or not the user is a member, and whether or not the user has a pending request,
    // While also left joining (because not all groups have to have an associated course) between groups and courses.
    const groupsResult = await pool.query(
        `SELECT
        g.id, g.name, g.description, g.course_id, g.join_policy, g.capacity, g.meeting_mode, g.created_at,
        c.code AS course_code,
        c.title AS course_title,
        (SELECT COUNT(*)::INT FROM group_members gm WHERE gm.group_id = g.id) AS member_count,
        EXISTS (SELECT 1 FROM group_members gm WHERE gm.group_id = g.id AND gm.user_id = $1) AS is_member,
        g.owner_id = $1 AS is_owner,
        EXISTS (SELECT 1 FROM join_requests jr WHERE jr.group_id = g.id AND jr.user_id = $1 AND jr.status = 'pending') AS has_pending_request
        FROM groups g
        LEFT JOIN courses c ON c.id = g.course_id
        ORDER BY g.created_at DESC`,
        [userId]
    );

    // Gather the row that corresponds the user information, and subsequently courses availability.
    const meRow = await pool.query(
        `SELECT program, year, study_style, group_size_min, group_size_max 
        FROM users
        WHERE id=$1`,
        [userId]
    );
    const profile = meRow.rows[0];

    const meCourseRows = await pool.query(
        `SELECT course_id
        FROM user_courses
        WHERE user_id=$1`,
        [userId]
    );

    const meAvailability = await pool.query(
        `SELECT day, hour
        FROM availability
        WHERE user_id=$1`,
        [userId]
    );

    // Construct the user object.
    const me: Me = {
        courseIds: meCourseRows.rows.map((course) => course.course_id),
        program: profile.program,
        year: profile.year,
        studyStyle: profile.study_style,
        groupSizeMin: profile.group_size_min,
        groupSizeMax: profile.group_size_max,
        freeSlots: new Set(meAvailability.rows.map((row) => `${row.day}-${row.hour}`))
    };

    // Query info each group and member availability, joining on user id.
    const groupResult = await pool.query(
        `SELECT gm.group_id, gm.user_id, u.program, u.year, u.study_style
        FROM group_members gm
        JOIN users u ON u.id = gm.user_id`
    );

    const groupAvailability = await pool.query(
        `SELECT gm.group_id, gm.user_id, a.day, a.hour
        FROM group_members gm
        JOIN availability a ON a.user_id = gm.user_id`
    );

    // Now, we essentially sort it out so that it can be parsed in a meaningful manner.
    const membersByGroup = new Map<number, { userId: number; program: string; year: number; studyStyle: string }[]>();
    for (const row of groupResult.rows) {
        if (!membersByGroup.has(row.group_id)) membersByGroup.set(row.group_id, []);
        membersByGroup.get(row.group_id)!.push({
            userId: row.user_id,
            program: row.program,
            year: row.year,
            studyStyle: row.study_style
        });
    }

    const slotsByGroup = new Map<number, Map<number, string[]>>();
    for (const row of groupAvailability.rows) {
        if (!slotsByGroup.has(row.group_id)) slotsByGroup.set(row.group_id, new Map());
        const groupSlots = slotsByGroup.get(row.group_id)!;

        if (!groupSlots.has(row.user_id)) groupSlots.set(row.user_id, []);
        groupSlots.get(row.user_id)!.push(`${row.day}-${row.hour}`);
    }

    // We construct a scored object that compiles group information, and the means necessary to calculate the score.
    const scored = groupsResult.rows.map((group) => {
        const members = (membersByGroup.get(group.id) ?? []).filter((member) => member.userId !== userId);
        const memberSlots = members.map((member) => slotsByGroup.get(group.id)?.get(member.userId) ?? []);
        const score = scoreGroup(me, { courseId: group.course_id, members, memberSlots })

        return { ...group, score };
    });

    // Return our scored object.
    res.json(scored);
});

router.get('/:id/members', requireAuth, async (req, res) => {
    const groupId = Number(req.params.id);
    if (!Number.isInteger(groupId) || groupId < 1) {
        return res.status(400).json({ error: 'Group id must be a positive integer.' });
    }

    const membersResult = await pool.query(
        `SELECT u.id, u.display_name, gm.role
        FROM groups g
        JOIN group_members gm ON gm.group_id = g.id
        JOIN users u ON u.id = gm.user_id
        WHERE g.id = $1 AND g.owner_id = $2
        ORDER BY CASE WHEN gm.role = 'owner' THEN 0 ELSE 1 END, u.display_name NULLS LAST, u.id`,
        [groupId, req.session.userId]
    );
    if (membersResult.rowCount === 0) {
        return res.status(404).json({ error: 'Group not found.' });
    }

    return res.json(membersResult.rows);
});

router.delete('/:id/members/:memberId', requireAuth, async (req, res, next) => {
    const userId = req.session.userId;
    const groupId = Number(req.params.id);
    const memberId = Number(req.params.memberId);
    if (!Number.isInteger(groupId) || groupId < 1 || !Number.isInteger(memberId) || memberId < 1) {
        return res.status(400).json({ error: 'Group and member ids must be positive integers.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const groupResult = await client.query(
            'SELECT id, owner_id FROM groups WHERE id = $1 FOR UPDATE',
            [groupId]
        );
        const group = groupResult.rows[0];
        if (!group || group.owner_id !== userId) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Group not found.' });
        }

        const memberResult = await client.query(
            `DELETE FROM group_members
            WHERE group_id = $1 AND user_id = $2 AND role = 'member' AND user_id <> $3
            RETURNING user_id`,
            [groupId, memberId, group.owner_id]
        );
        if (memberResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Group member not found.' });
        }

        await client.query(
            `INSERT INTO notifications (user_id, type, group_id, actor_id)
            VALUES ($1, 'kicked', $2, $3)`,
            [memberId, groupId, userId]
        );

        await client.query('COMMIT');
        return res.json({ status: 'removed' });
    } catch (err) {
        await client.query('ROLLBACK');
        return next(err);
    } finally {
        client.release();
    }
});

router.post('/:id/leave', requireAuth, async (req, res, next) => {
    const userId = req.session.userId;
    const groupId = Number(req.params.id);
    if (!Number.isInteger(groupId) || groupId < 1) {
        return res.status(400).json({ error: 'Group id must be a positive integer.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const groupResult = await client.query(
            'SELECT id, owner_id FROM groups WHERE id = $1 FOR UPDATE',
            [groupId]
        );
        const group = groupResult.rows[0];
        if (!group) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Group not found.' });
        }
        if (group.owner_id === userId) {
            await client.query('DELETE FROM groups WHERE id = $1', [groupId]);
            await client.query('COMMIT');
            return res.json({ status: 'deleted' });
        }

        const membershipResult = await client.query(
            'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2 RETURNING user_id',
            [groupId, userId]
        );
        if (membershipResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'You are not a member of this group.' });
        }

        await client.query(
            `INSERT INTO notifications (user_id, type, group_id, actor_id)
            VALUES ($1, 'left', $2, $3)`,
            [group.owner_id, groupId, userId]
        );

        await client.query('COMMIT');
        return res.json({ status: 'left' });
    } catch (err) {
        await client.query('ROLLBACK');
        return next(err);
    } finally {
        client.release();
    }
});

router.post('/:id/requests/:requestId', requireAuth, async (req, res, next) => {
    const userId = req.session.userId;
    const groupId = Number(req.params.id);
    const requestId = Number(req.params.requestId);
    const { decision } = req.body ?? {};

    if (!Number.isInteger(groupId) || groupId < 1 || !Number.isInteger(requestId) || requestId < 1) {
        return res.status(400).json({ error: 'Group and request ids must be positive integers.' });
    }
    if (decision !== 'accepted' && decision !== 'declined') {
        return res.status(400).json({ error: 'Decision must be accepted or declined.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const groupResult = await client.query(
            'SELECT id, owner_id, capacity FROM groups WHERE id = $1 FOR UPDATE',
            [groupId]
        );
        const group = groupResult.rows[0];
        if (!group || group.owner_id !== userId) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Group not found.' });
        }

        const requestResult = await client.query(
            `SELECT id, user_id FROM join_requests
            WHERE id = $1 AND group_id = $2 AND status = 'pending'
            FOR UPDATE`,
            [requestId, groupId]
        );
        const joinRequest = requestResult.rows[0];
        if (!joinRequest) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Pending request not found.' });
        }

        if (decision === 'accepted') {
            const countResult = await client.query(
                'SELECT COUNT(*)::int AS member_count FROM group_members WHERE group_id = $1',
                [groupId]
            );
            if (countResult.rows[0].member_count >= group.capacity) {
                await client.query('ROLLBACK');
                return res.status(409).json({ error: 'This group is full.' });
            }

            await client.query(
                `INSERT INTO group_members (group_id, user_id, role)
                VALUES ($1, $2, 'member')`,
                [groupId, joinRequest.user_id]
            );
        }

        await client.query(
            'UPDATE join_requests SET status = $1, decided_at = NOW() WHERE id = $2',
            [decision, requestId]
        );
        await client.query(
            `INSERT INTO notifications (user_id, type, group_id, actor_id)
            VALUES ($1, $2, $3, $4)`,
            [joinRequest.user_id, decision === 'accepted' ? 'request_accepted' : 'request_declined', groupId, userId]
        );

        await client.query('COMMIT');
        return res.json({ status: decision });
    } catch (err) {
        await client.query('ROLLBACK');
        return next(err);
    } finally {
        client.release();
    }
});

router.post('/:id/join', requireAuth, async (req, res, next) => {
    // We start by gathering the userId and the groupId, ensuring the the groupId is a positive integer.
    const userId = req.session.userId;
    const groupId = Number(req.params.id);
    if (!Number.isInteger(groupId) || groupId < 1) return res.status(400).json({ error: "Group id's can not be negative, or must be a number." });

    const { message } = req.body ?? {};
    const cleanedMessage = typeof message === 'string' ? message.trim() || null : message ?? null;
    const isValidMessage = cleanedMessage === null || (typeof cleanedMessage === 'string' && cleanedMessage.length <= 300);
    if (!isValidMessage) return res.status(400).json({ error: "Message is invalid." });

    // Now we open a database transaction.
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // First we gather the associated group using the groupId, ensuring it's locked before committing (FOR UPDATE).
        const groupRow = await client.query(
            "SELECT id, owner_id, join_policy, capacity FROM groups WHERE id = $1 FOR UPDATE",
            [groupId]
        );
        const group = groupRow.rows[0];
        if (!group) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: "Group not found." });
        }

        // Now we check whether or not the user is already a member of the group, returning an error if so.
        const isMemberRow = await client.query(
            "SELECT EXISTS (SELECT 1 FROM group_members WHERE group_id=$1 AND user_id=$2) AS is_member",
            [groupId, userId]
        );
        const isMember = isMemberRow.rows[0].is_member;
        if (isMember) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: "Already member." });
        }

        // Now we check whether or not the group is already at capacity, returning an error if so.
        const countResult = await client.query(
            "SELECT COUNT(*)::int AS member_count FROM group_members WHERE group_id = $1",
            [groupId]
        );
        const memberCount = countResult.rows[0].member_count;
        if (memberCount >= group.capacity) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: "Group already full." });
        }
        
        let status;
        if (group.join_policy === 'open') {
            // If the groups join policy is open, we add the user to the group, before sending a notification to the owner.
            await client.query(
                `INSERT INTO group_members (group_id, user_id, role)
                VALUES($1, $2, 'member')`,
                [groupId, userId]
            );
            await client.query(
                `INSERT INTO notifications (user_id, type, group_id, actor_id)
                VALUES($1, 'joined', $2, $3)`,
                [group.owner_id, groupId, userId]
            );
            status = { status: 'joined' }
        } else {
            // If the groups join policy isn't open, we send a join request, before notifying the owner.
            await client.query(
                `INSERT INTO join_requests (group_id, user_id, message) 
                VALUES ($1, $2, $3)`,
                [groupId, userId, cleanedMessage]
            );
            await client.query(
                `INSERT INTO notifications (user_id, type, group_id, actor_id)
                VALUES($1, 'new_request', $2, $3)`,
                [group.owner_id, groupId, userId]
            );
            status = { status: 'new_request'}
        }

        // Commit then return our status.
        await client.query('COMMIT');
        return res.json(status);
    } catch (err: any) {
        await client.query('ROLLBACK');
        if (err.code === '23505') return res.status(409).json({ error: "Unique key violation (usually means you made duplicate requests)." });
        next(err);
    } finally {
        client.release();
    }
});

export default router;