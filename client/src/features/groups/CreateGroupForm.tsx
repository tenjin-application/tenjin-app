import { useState, useEffect } from 'react';

import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox'
import { Button } from '@/components/ui/Button';
import { get, post } from '@/lib/api';
import { isSafeUrl } from '@shared/validation';

import type { Course } from '@shared/types';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

// Define capacity for the group.
const CAPACITY = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

// Type to define the general shape of our group data.
type CreateGroupData = {
    name: string;
    description: string;
    courseId: number | null;
    joinPolicy: 'open' | 'request';
    capacity: number;
    chatUrl: string;
    meetingMode: 'in_person' | 'online' | 'hybrid'; 
}

// Type to define the properties of our CreateGroupForm component.
type CreateGroupFormProps = {
    onCreated: () => void;
};

export default function CreateGroupForm({ onCreated }: CreateGroupFormProps) {
    const [form , setForm] = useState<CreateGroupData>({
        name: '',
        description: '',
        courseId: null,
        joinPolicy: 'request',
        capacity: 8,
        chatUrl: '',
        meetingMode: 'hybrid'
    });
    const [courses, setCourses] = useState<Course[]>([]);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(true);
    const update = (changes: Partial<CreateGroupData>) => setForm(prev => ({ ...prev, ...changes }));

    const trimmedUrl = form.chatUrl.trim();
    const chatUrlInvalid = trimmedUrl !== '' && !isSafeUrl(trimmedUrl);
    const nameValid = form.name.trim().length >= 3 && form.name.trim().length <= 60;

    // Function for handling submit.
    async function handleSubmit(e: React.SubmitEvent) {
        e.preventDefault();

        // First we set our submitting to true, and reset our error.
        setSubmitting(true);
        setError('');

        try {
            // Try to upload the group using the form, before calling the onCreated parameter.
            await post('/groups', form);
            onCreated();
        } catch (err) {
            // In case of an error, set the error message accordingly.
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            // Finally, set submitting to false.
            setSubmitting(false);
        }
    }

    // Loads courses.
    // TODO: This could probably use it's own hook or helper, honestly at this point.
    useEffect(() => {
        async function loadCourses() {
            try {
                // Gather course results, set it equal to courses.
                const result = await get('/courses');
                setCourses(result);
            } catch(err) {
                // If we have an error, course error reflects that.
                setError("Couldn't fetch, please try reloading.");
            } finally {
                // We have finished loading courses, course loading is set to false.
                setLoading(false);
            }
        }
        loadCourses();
    }, []);

    // TODO: Placeholder, will replace.
    if (loading) return <p>Loading...</p>
    
    return (
        <form onSubmit={handleSubmit}>
            <Input label="Name of group:" type="text" value={form.name} onChange={(e) => update({ name: e.target.value } )} />
            <Textarea label="Group description:" value={form.description} onChange={(e) => update({ description: e.target.value })} />
            <Select 
                label="Select courses (general for none):"
                value={form.courseId ?? ''}
                onChange={(e) => update({ courseId: e.target.value === '' ? null : Number(e.target.value) })}
                >
                <option value={''}>General</option>
                {courses.map((course) => (
                    <option key={`${course.id}`} value={course.id}>
                        {course.code}: {course.title}
                    </option> 
                ))}
            </Select>
            <fieldset>
                <legend>Group Preference:*</legend>
                <Checkbox 
                    label="Open" 
                    type="radio" 
                    value="open"
                    checked={form.joinPolicy === 'open'}
                    onChange={() => update({ joinPolicy: 'open' })} />
                <Checkbox 
                    label="Request only" 
                    type="radio" 
                    value="request"
                    checked={form.joinPolicy === 'request'}
                    onChange={() => update({ joinPolicy: 'request' })} />
            </fieldset>
            <Select
                label="Group capacity:"
                value={form.capacity}
                onChange={(e) => update({ capacity: Number(e.target.value) })}
            >
                {CAPACITY.map((num) => (
                    <option key={`member-num-${num}`} value={num}>
                        {num}
                    </option>
                ))}
            </Select>
            <Input
                label="External chat URL (optional):"
                type="url"
                value={form.chatUrl}
                onChange={(e) => update({ chatUrl: e.target.value })}
                error={chatUrlInvalid ? 'Enter a full link starting with https://' : ''}
            />
            <Select
                label="Meeting mode:"
                value={form.meetingMode}
                onChange={(e) => update({ meetingMode: e.target.value as 'in_person' | 'online' | 'hybrid'})}
            >
                <option value="hybrid">Hybrid</option>
                <option value="in_person">In person</option>
                <option value="online">Online</option>
            </Select>

            <Button type="submit" variant="primary" disabled={submitting || !nameValid || chatUrlInvalid}>
                {submitting ? 'Creating group...' : 'Create group'}
            </Button>
            {error && <ErrorMessage>{error}</ErrorMessage>}
        </form>
    );
}