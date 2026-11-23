import { test } from 'node:test';
import assert from 'node:assert/strict';

import { courseScore, scheduleScore, styleScore, programYearScore, sizeScore, scoreGroup } from './ranking.js';
import type { Me, GroupInfo } from './ranking.js';

/**
 * Creates a dummy Me object to be used for testing.
 * @param {Partial<Me>} overrides - overrides to partially update the Me instance.
 * @returns {Me} A Me instance, already initialized with default values.
 */
function makeMe(overrides: Partial<Me> = {}): Me {
    return {
        courseIds: [1],
        program: 'Computer Science',
        year: 2,
        studyStyle: 'quiet',
        groupSizeMin: 2,
        groupSizeMax: 6,
        freeSlots: new Set(['1-10', '1-11', '1-12']),
        ...overrides
    };
}

/**
 * Creates a dummy GroupInfo object to be used for testing.
 * @param {Partial<GroupInfo>} overrides - overrides to partially update the GroupInfo instance.
 * @returns {Me} A Me instance, already initialized with default values.
 */
function makeGroup(overrides: Partial<GroupInfo> = {}): GroupInfo {
    return {
        courseId: 1,
        members: [{ program: 'Computer Science', year: 2, studyStyle: 'quiet'}],
        memberSlots: [['1-10', '1-11', '1-12']],
        ...overrides
    };
}
// 1. COURSE
// Expect 1 because the user is in the same course the group is made for.
test('A score for a course I take.', () => {
    const me = makeMe();
    const group = makeGroup();
    const score = courseScore(me, group);
    assert.equal(score, 1);
});

// Expect 0.5 because the group is not set for any specific course.
test('A score for a General group (null)', () => {
    const me = makeMe();
    const score = courseScore(me, makeGroup({ courseId: null }));
    assert.equal(score, 0.5);
});

// Expect 0 because the user is not in the same course the group is made for.
test("A score for a course I don't take", () => {
    const me = makeMe()
    const score = courseScore(me, makeGroup({ courseId: 99 }));
    assert.equal(score, 0);
});

// 2. SCHEDULE
// Expect 2/6 because of the 4 slots, only Monday at 10 and Monday at 12 have at least 2 of the three members available.
test('At least 2 hours are shared between at least half of the members.', () => {
    const me = makeMe({ freeSlots: new Set(['1-10', '1-11', '1-12', '3-14']) });
    const group = makeGroup({
        members: [
            { program: 'Computer Science', year: 2, studyStyle: 'quiet' },
            { program: 'Computer Science', year: 2, studyStyle: 'quiet' },
            { program: 'Computer Science', year: 2, studyStyle: 'quiet' }
        ],
        memberSlots: [
            ['1-10', '1-12', '3-14'], // Member 1.
            ['1-10', '1-12'], // Member 2.
            ['1-12', '5-9'] // Member 3
        ]
    });
    const score = scheduleScore(me, group);
    assert.equal(score, 2 / 6);
});

// Expect 0.5 because I haven't saved any availability.
test("I haven't saved any hours for availability.", () => {
    const me = makeMe({ freeSlots: new Set([]) });
    const group = makeGroup();
    const score = scheduleScore(me, group);
    assert.equal(score, 0.5);
});

// Expect 0.5 because there are no group members (shouldn't actually occur, but still worth testing).
test('No members in the group.', () => {
    const me = makeMe();
    const group = makeGroup({
        members: [],
        memberSlots: []
    });
    const score = scheduleScore(me, group);
    assert.equal(score, 0.5);
});

// Expect 0.5 because there are members, but all of them never set their availability.
test('Group contains members, but none have any hours of availability saved', () => {
    const me = makeMe();
    const group = makeGroup({
        members: [
            { program: 'Computer Science', year: 2, studyStyle: 'quiet' },
            { program: 'Computer Science', year: 2, studyStyle: 'quiet' },
            { program: 'Computer Science', year: 2, studyStyle: 'quiet' }
        ],
        memberSlots: [[], [], []]
    });
    const score = scheduleScore(me, group);
    assert.equal(score, 0.5);
});

// Expect 3/6 because of the four members, one shares 3 hours, but the other three have none set.
test('Only 1 of 4 members saved hours, and they share 3 with me.', () => {
    const me = makeMe({ freeSlots: new Set(['1-10', '1-11', '1-12', '3-14']) });
    const group = makeGroup({
        members: [
            { program: 'Computer Science', year: 2, studyStyle: 'quiet' },
            { program: 'Computer Science', year: 2, studyStyle: 'quiet' },
            { program: 'Computer Science', year: 2, studyStyle: 'quiet' },
            { program: 'Computer Science', year: 2, studyStyle: 'quiet' },
        ],
        memberSlots: [
            ['1-10', '1-11', '1-12'], 
            [], 
            [], 
            []
        ]
    });
    const score = scheduleScore(me, group);
    assert.equal(score, 3 / 6);
});

// Expect 0 because everyone has hours but none of them match mine.
test('Everyone has a schedule, but none of the hours overlap.', () => {
    const me = makeMe({ freeSlots: new Set(['1-10', '1-11', '1-12']) });
    const group = makeGroup({
        members: [
            { program: 'Computer Science', year: 2, studyStyle: 'quiet' },
            { program: 'Computer Science', year: 2, studyStyle: 'quiet' },
        ],
        memberSlots: [
            ['3-10', '3-11', '3-12'], 
            ['5-10', '5-12', '5-14']
        ]
    });
    const score = scheduleScore(me, group);
    assert.equal(score, 0);
});

// Expect 1 because everyone has at least more than 6 shared hours.
test('More than 6 hours are shared between everyone in the group.', () => {
    const me = makeMe({ freeSlots: new Set(['1-10', '1-11', '1-12', '1-13', '1-14', '1-15', '1-16']) });
        const group = makeGroup({
        members: [
            { program: 'Computer Science', year: 2, studyStyle: 'quiet' },
            { program: 'Computer Science', year: 2, studyStyle: 'quiet' },
        ],
        memberSlots: [
            ['1-10', '1-11', '1-12', '1-13', '1-14', '1-15', '1-16'], 
            ['1-10', '1-11', '1-12', '1-13', '1-14', '1-15', '1-16']
        ]
    });
    const score = scheduleScore(me, group);
    assert.equal(score, 1);
});

// 3. STUDY STYLE
// Expect 0.5 because only 2 of 4 members match.
test('2 of 4 members match the users study style.', () => {
    const me = makeMe();
    const group = makeGroup({
        members: [
            { program: 'Computer Science', year: 2, studyStyle: 'quiet'},
            { program: 'Computer Science', year: 2, studyStyle: 'quiet'},
            { program: 'Computer Science', year: 2, studyStyle: 'discussion'},
            { program: 'Computer Science', year: 2, studyStyle: 'discussion'}
        ]
    });
    const score = styleScore(me, group);
    assert.equal(score, 0.5);
});

// Expect 0 because there are no members.
test('A group with no members should score 0 for style.', () => {
    const me = makeMe();
    const score = styleScore(me, makeGroup({ members: []}));
    assert.equal(score, 0);
});

// 4. PROGRAM AND YEAR
// Expect 1 because the member has the same program, and is in the required year range.
test('One member in the program, one year apart.', () => {
    const me = makeMe();
    const score = programYearScore(me, makeGroup({ members: [{ program: 'Computer Science', year: 3, studyStyle: 'quiet'}]}));
    assert.equal(score, 1);
});

// Expect 0 because the member has a different program, and are 3 years apart.
test('One member in a different program, 3 years apart.', () => {
    const me = makeMe();
    const score = programYearScore(me, makeGroup({ members: [{ program: 'Evil Computer Science', year: 5, studyStyle: 'quiet'}]}));
    assert.equal(score, 0);
});

// 5. SIZE
// Expect 1 because the group is within my group size preference.
test('Group fits my range, with myself in it.', () => {
    const me = makeMe();
        const group = makeGroup({
        members: [
            { program: 'Computer Science', year: 2, studyStyle: 'quiet'},
            { program: 'Computer Science', year: 2, studyStyle: 'quiet'},
            { program: 'Computer Science', year: 2, studyStyle: 'discussion'},
            { program: 'Computer Science', year: 2, studyStyle: 'discussion'}
        ]
    });
    const score = sizeScore(me, group);
    assert.equal(score, 1);
});

// Expected 0.75 because the group with me included is one over my preferred maximum.
test('Group size one over my maximum, me included.', () => {
    const me = makeMe();
    const group = makeGroup({
        members: [
            { program: 'Computer Science', year: 2, studyStyle: 'quiet'},
            { program: 'Computer Science', year: 2, studyStyle: 'quiet'},
            { program: 'Computer Science', year: 2, studyStyle: 'discussion'},
            { program: 'Computer Science', year: 2, studyStyle: 'discussion'},
            { program: 'Computer Science', year: 2, studyStyle: 'quiet'},
            { program: 'Computer Science', year: 2, studyStyle: 'quiet'}
        ]
    });
    const score = sizeScore(me, group);
    assert.equal(score, 0.75);
});

// 7. SCORE GROUP
// Expect 100 because every test scored 1.
test('A perfect match scores 100.', () => {
    const sixHours = ['1-10', '1-11', '1-12', '1-13', '1-14', '1-15'];
    const me = makeMe({ freeSlots: new Set(sixHours) });
    const group = makeGroup({ memberSlots: [sixHours] });
    const score = scoreGroup(me, group);
    assert.equal(score, 100);
});

// Expect 0 because of a total mismatch.
test('A perfect mismatch.', () => {
    const me = makeMe({ groupSizeMin: 6 });
    const group = makeGroup({
        courseId: 99,
        members: [{
            program: 'Evil Computer Science',
            year: 6,
            studyStyle: 'discussion'
        }],
        memberSlots: [
            ['6-10']
        ]
    });
    const score = scoreGroup(me, group);
    assert.equal(score, 0);
});