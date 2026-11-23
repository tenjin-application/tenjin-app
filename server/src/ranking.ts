// Type for the user and the fields required to determine compatibility.
export type Me = {
    courseIds: number[];
    program: string;
    year: number;
    studyStyle: string;
    groupSizeMin: number;
    groupSizeMax: number;
    freeSlots: Set<string>;
}

// Type for the group and the fields required to reference with Me to determine compatibility.
export type GroupInfo = {
    courseId: number | null;
    members: { program: string; year: number; studyStyle: string }[];
    memberSlots: string[][];
}

// Weight constants for the individual compatibility metrics.
const COURSE_WEIGHT = 0.35;
const SCHEDULE_WEIGHT = 0.30;
const STYLE_WEIGHT = 0.15;
const PROGRAM_YEAR_WEIGHT = 0.10;
const SIZE_WEIGHT = 0.10;
const TARGET_SHARED_HOURS = 6;
const SIZE_PENALTY_PER_MEMBER = 0.25;

/**
 * Scores the user based on whether or not the user is in the course the group is made for.
 * If general, return 0.5 by default. Returns 1 if it matches, and 0 otherwise.
 * @param {Me} me - The user being acted on.
 * @param {GroupInfo} group - The group being acted on.
 * @returns {number} - Cumulative score from 0-1, prior to being weighted.
 */
export function courseScore(me: Me, group: GroupInfo) {
    // Course the group is for.
    if (group.courseId === null) return 0.5;
    if (me.courseIds.includes(group.courseId)) return 1;
    return 0;
}

/**
 * Scores the user based on the number of shared time slots between group members.
 * Returns 0.5 if the user hasn't set their availability or all other members haven't either, and 0 if no hours are shared. Otherwise returns a range up to 1, capping at 1 when 6 hours are shared.
 * @param {Me} me - The user being acted on.
 * @param {GroupInfo} group - The group being acted on.
 * @returns {number} - Cumulative score from 0-1, prior to being weighted.
 */
export function scheduleScore(me: Me, group: GroupInfo) {
    // User didn't set availability assume 0.5 by default.
    if (me.freeSlots.size === 0) return 0.5;

    // Filter with slots by users who have their hours saved. Returning 0.5 if none of have selected hours anyways.
    const withSlots = group.memberSlots.filter((slots) => slots.length > 0);
    if (withSlots.length === 0) return 0.5;

    const memberSets = withSlots.map((slots) => new Set(slots));
    const requiredFree = Math.ceil(withSlots.length / 2);

    let shared = 0;
    for (const slot of me.freeSlots) {
        let count = 0;
        for (const set of memberSets) {
            if (set.has(slot)) count++;
        }
        if (count >= requiredFree) shared++;
    }
    return Math.min(shared / TARGET_SHARED_HOURS, 1);
}

/**
 * Scores the user based on the number of users which match their study style.
 * Returns 0 if completely different, otherwise returns a ratio.
 * @param {Me} me - The user being acted on.
 * @param {GroupInfo} group - The group being acted on.
 * @returns {number} - Cumulative score from 0-1, prior to being weighted.
 */
export function styleScore(me: Me, group: GroupInfo) {
    const memberCount = group.members.length;

    // Study style alignment.
    let styleCount = 0;
    for (const member of group.members) {
        if (member.studyStyle === me.studyStyle) styleCount++;
    }
    const styleRatio = memberCount > 0 ? styleCount / memberCount : 0;
    return styleRatio;
}

/**
 * Scores the user based on a split ratio between shared programs and year between group members.
 * Returns 0 if incompatible, otherwise returns an evenly split ratio between year and program.
 * @param {Me} me - The user being acted on.
 * @param {GroupInfo} group - The group being acted on.
 * @returns {number} - Cumulative score from 0-1, prior to being weighted.
 */
export function programYearScore(me: Me, group: GroupInfo) {
    const memberCount = group.members.length;

    // Program and year.
    let programYearTotal = 0;
    for (const member of group.members) {
        if (member.program === me.program) programYearTotal += 0.5;
        if (Math.abs(member.year - me.year) <= 1) programYearTotal += 0.5;
    }
    const programYearRatio = memberCount > 0 ? programYearTotal / memberCount : 0;
    return programYearRatio;
}

/**
 * Scores the user based on whether or not the group size falls within the users specified range.
 * Returns 0 if there is a 4 member difference, otherwise returns a gradient, with 1 within range, and 1 - 0.25 per member outside of that range.
 * @param {Me} me - The user being acted on.
 * @param {GroupInfo} group - The group being acted on.
 * @returns {number} - Cumulative score from 0-1, prior to being weighted.
 */
export function sizeScore(me: Me, group: GroupInfo) {
    const memberCount = group.members.length;
    const sizeWithMe = memberCount + 1;
    
    // Group size, counting me, since that's the group I'd actually be in.
    let sizeDifference = 0;
    if (sizeWithMe < me.groupSizeMin) {
        sizeDifference = me.groupSizeMin - sizeWithMe;
    } else if (sizeWithMe > me.groupSizeMax) {
        sizeDifference = sizeWithMe - me.groupSizeMax;
    }
    return Math.max(0, 1 - sizeDifference * SIZE_PENALTY_PER_MEMBER);
}

/**
 * Combines all of the scoring helpers, before weighing them and returning them as a score between 0-100%.
 * @param {Me} me - The user being acted on.
 * @param {GroupInfo} group - The group being acted on.
 * @returns {number} - Final score between 0-100%.
 */
export function scoreGroup(me: Me, group: GroupInfo): number {
    let score = 0;

    score += courseScore(me, group) * COURSE_WEIGHT;
    score += scheduleScore(me, group) * SCHEDULE_WEIGHT;
    score += styleScore(me, group) * STYLE_WEIGHT;
    score += programYearScore(me, group) * PROGRAM_YEAR_WEIGHT;
    score += sizeScore(me, group) * SIZE_WEIGHT;
    return Math.round(score * 100);
}