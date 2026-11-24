import express from 'express';
import { pool } from '../../db.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { PROGRAMS } from '../../../../shared/programs.js';

const router = express.Router();

router.get('/availability', requireAuth, async (req, res, next) => {
    const userId = req.session.userId;
    const userAvailabilityResult = await pool.query(
        `SELECT * 
        FROM availability WHERE user_id = $1`,
        [userId]
    );

    // console.log(userAvailabilityResult);
    
    if (!userAvailabilityResult) {
        return req.session.destroy((err) => {
            if (err) return next(err);
            return res.status(401).json({ error: "User not found." });
        });
    }
    return res.json(userAvailabilityResult.rows.map((row) => ({
        day: row.day,
        hour: row.hour
    })))
})

router.get('/course_ids', requireAuth, async (req, res, next) => {
    const userId = req.session.userId;
    const userCourseIdResult = await pool.query(
        `SELECT * FROM user_courses WHERE user_id = $1`,
        [userId]
    );
    console.log(userCourseIdResult);
    if (!userCourseIdResult) {
        return req.session.destroy((err) => {
            if (err) return next(err);
            return res.status(401).json({ error: "User not found." });
        });
    }
    return res.json(userCourseIdResult.rows.map((row) => ({
        course_id: row.course_id
    })));
})

router.delete('/delete_user', requireAuth, async (req, res, next) => {
    const userId = req.session.userId;
    console.log("DELETE REQUESTED");
    const deleteUserResult = await pool.query(
        'DELETE FROM users WHERE id = $1',
        [userId]
    );
    if (!deleteUserResult) {
        return req.session.destroy((err) => {
            if (err) return next(err);
            return res.status(401).json({ error: "User not found." });
        });
    }
    console.log(`RESULT: ${deleteUserResult}`);
    return res.json({ deleted: true });
})

router.patch('/', requireAuth, async (req, res, next) => {
    const allowedFields = ['display_name', 'program', 'year', 'bio', 'course_ids', 'availability', 'study_style', 'group_size_min', 'group_size_max'] as const;
    type AllowedFields = (typeof allowedFields)[number];

    const invalid: AllowedFields[] = [];
    
    const updatedFields: string[] = [];
    const updatedCourseIds: number[] = [];
    const { availability } = req.body;
    const userId = req.session.userId;



    const fieldValidators: Record<AllowedFields, (val: any) => void> = {
        display_name: (val) => {
            const isValidDisplayName = typeof val === 'string' && val.trim() !== '' && val.length <= 40;
            if (!isValidDisplayName) invalid.push('display_name');
            updatedFields.push(`display_name='${val.trim()}'`)
        },
        program: (val) => {
            const isValidProgram = PROGRAMS.includes(val);
            if (!isValidProgram) invalid.push('program');
            updatedFields.push(`program='${val}'`)
        },
        year: (val) => {
            const isValidYear = Number.isInteger(val) && (val >= 1 && val <= 6);
            if (!isValidYear) invalid.push('year');
            updatedFields.push(`year=${val}`)
        },
        bio: (val) => {
            const isValidBio = typeof val === 'string' && val.length <= 500;
            if (!isValidBio) invalid.push('bio');
            updatedFields.push(`bio='${val}'`)
        },
        course_ids: (val) => {
            const isValidCourseIds = Array.isArray(val) && val.length > 0 && val.every(Number.isInteger);
            if (!isValidCourseIds) invalid.push('course_ids');
            for (const value of val) {
                updatedCourseIds.push(value);
            }
        },
        availability: (val) => {
            const validSlot = (slot: any) => typeof slot === 'object' && slot !== null && Number.isInteger(slot.day) && slot.day >= 0 && slot.day <= 6 && Number.isInteger(slot.hour) && slot.hour >= 8 && slot.hour <= 22;
            const isValidAvailability = Array.isArray(val) && val.every(validSlot);
            if (!isValidAvailability) invalid.push('availability');
            
        },
        study_style: (val) => {
            const isValidStudyStyle = val === 'quiet' || val === 'discussion' || val === 'mixed';
            if (!isValidStudyStyle) invalid.push('study_style');
            updatedFields.push(`study_style='${val}'`)
        },
        group_size_min: (val) => {
            const isValidGroupSizeMin = Number.isInteger(val) && (val >= 2 && val <= 20) && val <= val;
            if (!isValidGroupSizeMin) invalid.push('group_size_min');
            updatedFields.push(`group_size_min='${val}'`)
        },
        group_size_max: (val) => {
            const isValidGroupSizeMax = Number.isInteger(val) && (val >= 2 && val <= 20) && val >= val;
            if (!isValidGroupSizeMax) invalid.push('group_size_max');
            updatedFields.push(`group_size_max='${val}'`)
        }
    }

    for (const field of allowedFields) {
        const value = req.body[field];
        if (value === undefined) continue;
        fieldValidators[field]?.(value);
    }

    // If at any point an invalid response is added to the invalid array, respond.
    if (invalid.length > 0) return res.status(400).json({ error: "Some fields are invalid.", fields: invalid });

    const unique = new Map();
    for (const slot of availability) {
        unique.set(`${slot.day}-${slot.hour}`, slot);
    }
    const slots = [...unique.values()];
    const days = slots.map((slot) => slot.day);
    const hours = slots.map((slot) => slot.hour);

    const uniqueCourseIds = [...new Set(updatedCourseIds)];

    const client = await pool.connect()

    try {
        await client.query('BEGIN');
        // First, we insert user info into the table.
        await client.query(
            `UPDATE users 
            SET ${updatedFields.join(', ')} 
            WHERE id=$1`,
            [userId]
        );

        if (uniqueCourseIds.length >= 1) {
            await client.query(
                "DELETE FROM user_courses WHERE user_id=$1",
                [userId]
            );

            await client.query(
                `INSERT INTO user_courses (user_id, course_id)
                SELECT $1, UNNEST($2::INT[])`,
                [userId, uniqueCourseIds]
            );
        }

        if (unique.size >= 1) {
            await client.query(
                "DELETE FROM availability WHERE user_id=$1",
                [userId]
            );
            await client.query(
                `INSERT INTO availability (user_id, day, hour)
                SELECT $1, UNNEST($2::INT[]), UNNEST($3::INT[])`,
                [userId, days, hours]
            );
        }

        await client.query('COMMIT');
    } catch (err: any) {
        await client.query('ROLLBACK');
        console.log(err);

        if (err.code == '23503')  return res.status(400).json({ error: "One or more provided courses don't exist." });
        return next(err);
    } finally {
        client.release();
    }
    res.json({ ok: true });
})

export default router;