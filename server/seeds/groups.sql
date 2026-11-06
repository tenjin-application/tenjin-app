-- Run after the courses seed: psql tenjin -f seeds/groups.sql

-- Clear previous seed groups (members and requests cascade with them).
DELETE FROM groups
WHERE owner_id IN (SELECT id FROM users WHERE email LIKE '%.seed@ontariotechu.net');

-- Fake students to own and join the groups.
INSERT INTO users (email, display_name, program, year, study_style, onboarded_at) VALUES
    ('maya.seed@ontariotechu.net',  'Maya',  'Computer Science',                       2, 'discussion', NOW()),
    ('liam.seed@ontariotechu.net',  'Liam',  'Software Engineering',                   2, 'quiet',      NOW()),
    ('priya.seed@ontariotechu.net', 'Priya', 'Computer Science',                       3, 'mixed',      NOW()),
    ('omar.seed@ontariotechu.net',  'Omar',  'Mechatronics Engineering',               1, 'discussion', NOW()),
    ('zoe.seed@ontariotechu.net',   'Zoe',   'Game Development and Interactive Media', 2, 'mixed',      NOW()),
    ('ethan.seed@ontariotechu.net', 'Ethan', 'Computer Science',                       2, 'quiet',      NOW())
ON CONFLICT (email) DO NOTHING;

-- Groups. Courses are picked by position, so this works whatever courses you seeded.
-- If you have fewer courses than an OFFSET asks for, that group just gets no course.
INSERT INTO groups (name, description, course_id, owner_id, join_policy, capacity, chat_url, meeting_mode) VALUES
    ('Midterm grind', 'Weekly problem sets before the midterm. Bring your own questions.',
    (SELECT id FROM courses ORDER BY code LIMIT 1 OFFSET 0),
    (SELECT id FROM users WHERE email = 'maya.seed@ontariotechu.net'), 'open', 6, 'https://discord.gg/example1', 'hybrid'),
    ('Quiet library crew', 'Silent study on the 3rd floor. Headphones encouraged.',
    (SELECT id FROM courses ORDER BY code LIMIT 1 OFFSET 1),
    (SELECT id FROM users WHERE email = 'liam.seed@ontariotechu.net'), 'request', 4, NULL, 'in_person'),
    ('Late-night debugging', 'For when the assignment is due at midnight and nothing compiles.',
    (SELECT id FROM courses ORDER BY code LIMIT 1 OFFSET 2),
    (SELECT id FROM users WHERE email = 'priya.seed@ontariotechu.net'), 'open', 8, 'https://discord.gg/example2', 'online'),
    ('Full house', 'Small group, already full. Here to test the Full button.',
    (SELECT id FROM courses ORDER BY code LIMIT 1 OFFSET 0),
    (SELECT id FROM users WHERE email = 'omar.seed@ontariotechu.net'), 'open', 3, NULL, 'hybrid'),
    ('Proof practice', 'Working through proofs together, one theorem at a time.',
    (SELECT id FROM courses ORDER BY code LIMIT 1 OFFSET 3),
    (SELECT id FROM users WHERE email = 'zoe.seed@ontariotechu.net'), 'request', 5, 'https://discord.gg/example3', 'online'),
    ('General study hall', NULL,
    NULL,
    (SELECT id FROM users WHERE email = 'ethan.seed@ontariotechu.net'), 'open', 10, NULL, 'in_person'),
    ('Exam prep sprint', 'Two weeks out from finals. Practice exams every Thursday.',
    (SELECT id FROM courses ORDER BY code LIMIT 1 OFFSET 1),
    (SELECT id FROM users WHERE email = 'maya.seed@ontariotechu.net'), 'request', 6, NULL, 'hybrid'),
    ('Lab report review', 'Swap lab reports and give each other feedback before submitting.',
    (SELECT id FROM courses ORDER BY code LIMIT 1 OFFSET 2),
    (SELECT id FROM users WHERE email = 'liam.seed@ontariotechu.net'), 'open', 4, NULL, 'online');

-- Every owner is also a member with role 'owner'.
INSERT INTO group_members (group_id, user_id, role)
SELECT id, owner_id, 'owner' FROM groups
ON CONFLICT DO NOTHING;

-- Extra members, so the counts vary and "Full house" is full (3 / 3).
INSERT INTO group_members (group_id, user_id, role)
SELECT g.id, u.id, 'member'
FROM groups g, users u
WHERE (g.name, u.email) IN (
    ('Midterm grind',        'liam.seed@ontariotechu.net'),
    ('Midterm grind',        'priya.seed@ontariotechu.net'),
    ('Quiet library crew',   'ethan.seed@ontariotechu.net'),
    ('Late-night debugging', 'maya.seed@ontariotechu.net'),
    ('Late-night debugging', 'omar.seed@ontariotechu.net'),
    ('Late-night debugging', 'zoe.seed@ontariotechu.net'),
    ('Full house',           'maya.seed@ontariotechu.net'),
    ('Full house',           'liam.seed@ontariotechu.net'),
    ('General study hall',   'zoe.seed@ontariotechu.net'),
    ('Exam prep sprint',     'priya.seed@ontariotechu.net')
)
ON CONFLICT DO NOTHING;