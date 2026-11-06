// Type for the User, could possibly be used in both client and server.
export type User = {
    id: number;
    email: string;
    display_name: string | null;
    program: string | null;
    year: number | null;
    bio: string | null;
    study_style: 'quiet' | 'discussion' | 'mixed' | null;
    group_size_min: number | null;
    group_size_max: number | null;
    onboarded_at: string | null;
};

// Type for group structure.
export type Group = {
    id: number;
    name: string;
    description: string | null;
    join_policy: 'request' | 'open';
    capacity: number;
    meeting_mode: 'in_person' | 'online' | 'hybrid';
    created_at: string;
    course_code: string | null;
    course_title: string | null;
    member_count: number;
    is_member: boolean;
    has_pending_request: boolean;
}

// Courses must be made up of an id, code, and title.
export type Course = {
    id: number;
    code: string;
    title: string;
}