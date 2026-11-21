import express from 'express';
import { pool } from '../../db.js';
import { requireAuth } from '../../middleware/requireAuth.js';
import { PROGRAMS } from '../../../../shared/programs.js';

const router = express.Router();


router.patch('/', requireAuth, async (req, res, next) => {
    const allowedFields = ['display_name', 'program', 'year', 'bio', 'course_ids', 'availability', 'study_style', 'group_size_min', 'group_size_max'] as const;
    type AllowedFields = (typeof allowedFields)[number];

    const invalid: AllowedFields[] = [];
    
    const updatedFields: string[] = [];
    const userId = req.session.userId;



    const fieldValidators: Record<AllowedFields, (val: any) => void> = {
        display_name: (val) => {
            console.log("DISPLAY NAME");
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
        },
        availability: (val) => {
            const validSlot = (slot: any) => typeof slot === 'object' && slot !== null && Number.isInteger(slot.day) && slot.day >= 0 && slot.day <= 6 && Number.isInteger(slot.hour) && slot.hour >= 8 && slot.hour <= 22;
            const isValidAvailability = Array.isArray(val) && val.every(validSlot);
            if (!isValidAvailability) invalid.push('availability');
        },
        study_style: (val) => {
            console.log('STUDY STYLE')
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

    console.log(req.body);

    for (const field of allowedFields) {
        const value = req.body[field];
        if (value === undefined) continue;
        fieldValidators[field]?.(value);
    }

    // If at any point an invalid response is added to the invalid array, respond.
    if (invalid.length > 0) return res.status(400).json({ error: "Some fields are invalid.", fields: invalid });

    // Basically, we map each unique slot to a map, before mapping the values into an array, then splitting them down by days and hours.

    const client = await pool.connect()

    console.log(`UPDATE users 
        SET $1 
        WHERE id=$2`,
        [updatedFields.join(', '), userId]);
    console.log(req.body)

    try {
        await client.query('BEGIN');
        // First, we insert user info into the table.
        await client.query(
            `UPDATE users 
            SET ${updatedFields.join(', ')} 
            WHERE id=$1`,
            [userId]
        );
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