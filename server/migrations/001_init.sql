-- Oh yeah, quick note. connect-pg-simple creates the sessions table automatically, so don't worry about it here.

-- Related to individual users.
CREATE TABLE users (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT NOT NULL UNIQUE CHECK (email = LOWER(email)),
    display_name TEXT,
    program TEXT,
    year SMALLINT CHECK (year BETWEEN 1 AND 6),
    bio TEXT CHECK (CHAR_LENGTH(bio) <= 500),
    study_style TEXT CHECK (study_style IN ('quiet', 'discussion', 'mixed')),
    group_size_min SMALLINT DEFAULT 2 CHECK (group_size_min >= 2),
    group_size_max SMALLINT DEFAULT 6 CHECK (group_size_max <= 20),
    onboarded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CHECK (group_size_min <= group_size_max)
);

-- Couple notes, one row is sent per code. We store the hash, THE FECKING HASH!
CREATE TABLE login_codes (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts SMALLINT NOT NULL DEFAULT 0,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX login_codes_email_idx ON login_codes (email, created_at DESC);

-- Related to courses and availability.
CREATE TABLE courses (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL
);

CREATE TABLE user_courses (
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses (id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, course_id)
);

-- One row for each free hour. So, day = 0 means Sunday, 6 = Saturday. Hour = 8 means 8:00-9:00.
CREATE TABLE availability (
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    day SMALLINT NOT NULL CHECK (day BETWEEN 0 AND 6),
    hour SMALLINT NOT NULL CHECK (hour BETWEEN 8 AND 22),
    PRIMARY KEY (user_id, day, hour)
);

-- Related to groups.
CREATE TABLE groups (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name TEXT NOT NULL CHECK (CHAR_LENGTH(name) BETWEEN 3 AND 60),
    description TEXT CHECK (CHAR_LENGTH(description) <= 1000),
    course_id INTEGER REFERENCES courses (id) ON DELETE SET NULL,
    owner_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    join_policy TEXT NOT NULL DEFAULT 'request' CHECK (join_policy IN ('open', 'request')),
    capacity SMALLINT NOT NULL DEFAULT 8 CHECK (capacity BETWEEN 2 AND 20),
    chat_url TEXT,
    meeting_mode TEXT NOT NULL DEFAULT 'hybrid' CHECK (meeting_mode IN ('in_person', 'online', 'hybrid')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX groups_course_idx ON groups (course_id);

CREATE TABLE group_members (
    group_id INTEGER NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'member')),
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (group_id, user_id)
);
CREATE INDEX group_members_user_idx ON group_members (user_id);
CREATE UNIQUE INDEX one_owner_per_group ON group_members (group_id) WHERE role = 'owner';

CREATE TABLE join_requests (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups (id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    message TEXT CHECK (CHAR_LENGTH(message) <= 300),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    decided_at TIMESTAMPTZ
);
-- one_pending_request is so that theres only one per user per group.
CREATE UNIQUE INDEX one_pending_request ON join_requests (group_id, user_id) WHERE status = 'pending';
CREATE INDEX join_requests_group_pending_idx ON join_requests (group_id) WHERE status = 'pending';

-- Notifications.
CREATE TABLE notifications (
    id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('joined', 'left', 'kicked', 'request_accepted', 'request_declined', 'new_request')),
    group_id INTEGER REFERENCES groups (id) ON DELETE SET NULL,
    actor_id INTEGER REFERENCES users (id) ON DELETE SET NULL,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX notifications_user_idx ON notifications (user_id, created_at DESC);