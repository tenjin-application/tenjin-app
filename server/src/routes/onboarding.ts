import express from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { pool } from '../db.js';
import { PROGRAMS } from '../../../shared/programs.js';
const router = express.Router();

router.patch('/', requireAuth, async (req, res, next) => {
    // We define an array to hold invalid fields, and destructure them from the req.body.
    const invalid: string[] = [];
    const { displayName, program, year, bio, courseIds, availability, studyStyle, groupSizeMin, groupSizeMax } = req.body;
    const userId = req.session.userId;

    // Valid if our display name is a string, not empty while trimmed, and it's length is less than or equal to 40 characters.
    const isValidDisplayName = typeof displayName === 'string' && displayName.trim() !== '' && displayName.length <= 40;
    if (!isValidDisplayName) invalid.push('displayName');

    // Valid if the submitted program exists in our PROGRAMS array constant.
    const isValidProgram = PROGRAMS.includes(program);
    if (!isValidProgram) invalid.push('program');

    // Valid is year is a number, and is between 1 and 6.
    const isValidYear = Number.isInteger(year) && (year >= 1 && year <= 6);
    if (!isValidYear) invalid.push('year');

    // Valid if the bio is a string and is less than or equal to 500 characters.
    const isValidBio = typeof bio === 'string' && bio.length <= 500;
    if (!isValidBio) invalid.push('bio');

    // Valid if course ids are an array, have some length, and every one is an integer.
    const isValidCourseIds = Array.isArray(courseIds) && courseIds.length > 0 && courseIds.every(Number.isInteger);
    if (!isValidCourseIds) invalid.push('courseIds');

    // Pretty much, valid if availability is an array, and every value is a valid slot.
    const validSlot = (slot: any) => typeof slot === 'object' && slot !== null && Number.isInteger(slot.day) && slot.day >= 0 && slot.day <= 6 && Number.isInteger(slot.hour) && slot.hour >= 8 && slot.hour <= 22;
    const isValidAvailability = Array.isArray(availability) && availability.every(validSlot);
    if (!isValidAvailability) invalid.push('availability');

    // Valid if studyStyle is one of three possible choices.
    const isValidStudyStyle = studyStyle === 'quiet' || studyStyle === 'discussion' || studyStyle === 'mixed';
    if (!isValidStudyStyle) invalid.push('studyStyle');

    // Valid if the min size is an integer, is between 2 to 20 members, and is less than the max number of members.
    const isValidGroupSizeMin = Number.isInteger(groupSizeMin) && (groupSizeMin >= 2 && groupSizeMin <= 20) && groupSizeMin <= groupSizeMax;
    if (!isValidGroupSizeMin) invalid.push('groupSizeMin');

    // Valid if the max is an integer, is between 2 and 20, and is greater than the min number of members.
    const isValidGroupSizeMax = Number.isInteger(groupSizeMax) && (groupSizeMax >= 2 && groupSizeMax <= 20) && groupSizeMax >= groupSizeMin;
    if (!isValidGroupSizeMax) invalid.push('groupSizeMax');

    // If at any point an invalid response is added to the invalid array, respond.
    if (invalid.length > 0) return res.status(400).json({ error: "Some fields are invalid.", fields: invalid });

    // Basically, we map each unique slot to a map, before mapping the values into an array, then splitting them down by days and hours.
    const unique = new Map();
    for (const slot of availability) {
        unique.set(`${slot.day}-${slot.hour}`, slot);
    }
    const slots = [...unique.values()];
    const days = slots.map((slot) => slot.day);
    const hours = slots.map((slot) => slot.hour);

    // We must assume that the user could have invalid input, so we set the array to a set, so that only unique values exist.
    const uniqueCourseIds = [...new Set(courseIds)];

    // It is essential that we have a rollback in place while trying to commit this data to the database, otherwise the user could be 'broken', so to speak.
    // (This was less important with login because data at most would be wasted, this can leave behind wrong information).
    const client = await pool.connect()
    try {
        await client.query('BEGIN');
        // First, we insert user info into the table.
        await client.query(
            `UPDATE users 
            SET display_name=$1, program=$2, year=$3, bio=$4, study_style=$5, group_size_min=$6, group_size_max=$7, onboarded_at=NOW()
            WHERE id=$8`,
            [displayName.trim(), program, year, bio, studyStyle, groupSizeMin, groupSizeMax, userId]
        );
        
        // Now, we delete any prior user courses tied to the user, before updating them with our new courses.
        await client.query(
            "DELETE FROM user_courses WHERE user_id=$1",
            [userId]
        );
        await client.query(
            `INSERT INTO user_courses (user_id, course_id)
            SELECT $1, UNNEST($2::INT[])`,
            [userId, uniqueCourseIds]
        );
        
        // In a similar fashion, we first delete any data on availability from the table, before updating it with the new schedule.
        await client.query(
            "DELETE FROM availability WHERE user_id=$1",
            [userId]
        );
        await client.query(
            `INSERT INTO availability (user_id, day, hour)
            SELECT $1, UNNEST($2::INT[]), UNNEST($3::INT[])`,
            [userId, days, hours]
        );
        await client.query('COMMIT');
    } catch (err: any) {
        await client.query('ROLLBACK');

        // Foreign key violation, likely just means they tried to provide a course id that doesn't exist.
        if (err.code == '23503')  return res.status(400).json({ error: "One or more provided courses don't exist." });
        return next(err);
    } finally {
        client.release();
    }
    res.json({ ok: true });
});

export default router;