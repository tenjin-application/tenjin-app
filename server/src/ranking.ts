export type Me = {
    courseIds: number[];
    program: string;
    year: number;
    studyStyle: string;
    groupSizeMin: number;
    groupSizeMax: number;
    freeSlots: Set<string>;
}

export type GroupInfo = {
    courseId: number | null;
    members: { program: string; year: number; studyStyle: string }[];
    memberSlots: string[][];
}

const COURSE_WEIGHT = 0.35;
const SCHEDULE_WEIGHT = 0.30;
const STYLE_WEIGHT = 0.15;
const PROGRAM_YEAR_WEIGHT = 0.10;
const SIZE_WEIGHT = 0.10;
const TARGET_SHARED_HOURS = 6;

export function scoreGroup(me: Me, group: GroupInfo): number {
    let score = 0;
    const memberCount = group.members.length; // All members but me.
    const sizeWithMe = memberCount + 1; // The group size after I would join.

    // Course the group is for.
    if (group.courseId === null) {
        score += 0.5 * COURSE_WEIGHT;
    } else if (me.courseIds.includes(group.courseId)) {
        score += 1 * COURSE_WEIGHT;
    }

    // Schedule alignment.
    if (me.freeSlots.size === 0) {
        score += 0.5 * SCHEDULE_WEIGHT;
    } else if (memberCount > 0) {
        const memberSets = group.memberSlots.map((slots) => new Set(slots));
        const requiredFree = Math.ceil(memberCount / 2);

        let shared = 0;
        for (const slot of me.freeSlots) {
            let count = 0;
            for (const set of memberSets) {
                if (set.has(slot)) count++;
            }
            if (count >= requiredFree) shared++;
        }
        score += Math.min(shared / TARGET_SHARED_HOURS, 1) * SCHEDULE_WEIGHT;
    }
    // No other members: nothing to compare, so the schedule adds 0.

    // Study style alignment.
    let styleCount = 0;
    for (const member of group.members) {
        if (member.studyStyle === me.studyStyle) styleCount++;
    }
    const styleRatio = memberCount > 0 ? styleCount / memberCount : 0;
    score += styleRatio * STYLE_WEIGHT;

    // Program and year.
    let programYearTotal = 0;
    for (const member of group.members) {
        if (member.program === me.program) programYearTotal += 0.5;
        if (Math.abs(member.year - me.year) <= 1) programYearTotal += 0.5;
    }
    const programYearRatio = memberCount > 0 ? programYearTotal / memberCount : 0;
    score += programYearRatio * PROGRAM_YEAR_WEIGHT;

    // Group size, counting me, since that's the group I'd actually be in.
    let sizeDifference = 0;
    if (sizeWithMe < me.groupSizeMin) {
        sizeDifference = me.groupSizeMin - sizeWithMe;
    } else if (sizeWithMe > me.groupSizeMax) {
        sizeDifference = sizeWithMe - me.groupSizeMax;
    }
    score += Math.max(0, 1 - sizeDifference * 0.25) * SIZE_WEIGHT;

    return Math.round(score * 100);
}