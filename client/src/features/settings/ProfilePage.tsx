import { useState, useEffect, useRef } from 'react';
import { del, get, patch, post } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { PROGRAMS } from '@shared/programs';
import { useRequireUser } from '@/hooks/useRequireUser';
import type { Course } from '@shared/types';
import { useNavigate } from 'react-router-dom';

const YEARS = [1, 2, 3, 4, 5, 6] as const;
type Years = (typeof YEARS)[number];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

interface ProfileSettings {
    display_name: string;
    email: string;
    program: string;
    year: Years;
    bio: string;
    study_style: 'quiet' | 'discussion' | 'mixed' | '';
    group_size_min: number;
    group_size_max: number;
    course_ids: number[];
    availability: { day: number; hour: number }[];
}

export default function ProfilePage() {
    const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
        display_name: '',
        email: '',
        program: '',
        year: 1,
        bio: '',
        study_style: '',
        group_size_min: 0,
        group_size_max: 0,
        course_ids: [],
        availability: []
    })
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const isInitialLoad = useRef<boolean>(true);
    const user = useRequireUser();
    const availIsSelected = (day: number, hour: number) => profileSettings.availability.some(slot => slot.day === day && slot.hour === hour);
    const [courseSearch, setCourseSearch] = useState('');

    const [courses, setCourses] = useState<Course[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [coursesError, setCoursesError] = useState('');
    const search = courseSearch.toLowerCase();
    const searchedCourses = courses.filter((course) =>
        course.code.toLowerCase().includes(search) || course.title.toLowerCase().includes(search)
    );
    const [deleting, setDeleting] = useState(false);
    const [deleteConfim, setDeleteConfirm] = useState(false);
    const [accountDeleted, setDeleted] = useState(false);
    const dialogRef = useRef<HTMLDialogElement>(null);
    const navigate = useNavigate();

    useEffect(() => {
        async function loadCourses() {
            try {
                // Gather course results, set it equal to courses.
                const result = await get('/courses');
                setCourses(result);
            } catch(err) {
                // If we have an error, course error reflects that.
                setCoursesError("Couldn't fetch, please try reloading.");
            } finally {
                // We have finished loading courses, course loading is set to false.
                setCoursesLoading(false);
            }
        }
        loadCourses();
    }, []);

    useEffect(() => {
        let enabled = true;
        
        async function loadSettings() {
            try {
                const result = await get('/auth/me');
                const availresult = await get('/settings/profile/availability');
                const newAvail: { day: number; hour: number }[] = [];
                for (const time of availresult) {
                    newAvail.push({ day: time.day, hour: time.hour});
                }

                result.user.availability = newAvail;

                const courseIdsResult = await get('/settings/profile/course_ids');
                const newCourseIds: number[] = [];
                for (const id of courseIdsResult) {
                    newCourseIds.push(id.course_id);
                }
                
                result.user.course_ids = newCourseIds;

                if (enabled) {
                    setProfileSettings(result.user);
                }
            } catch (err) {
                if (enabled) setStatusMessage(`${err}`);
            } finally {
                if (enabled) setIsLoading(false);
            }
        }
    
        loadSettings();
        return () => {
            enabled = false;
          };
      }, [user]);

    const handleChange = (element: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = element.target;
        const isCheckbox = element.target instanceof HTMLInputElement && type === 'checkbox';
        setProfileSettings((prev) => ({
            ...prev,
            [name]: isCheckbox ? (element.target as HTMLInputElement).checked : ((name == 'year' || type == 'number') ? Number(value) : value),
        }));
    };

    const update = (changes: Partial<ProfileSettings>) => setProfileSettings(prev => ({ ...prev, ...changes}));

    const handleAvailabilityChange = (day: number, hour: number) => {
        const selected = availIsSelected(day, hour);
        update({
            availability: selected
                ? profileSettings.availability.filter(slot => !(slot.day === day && slot.hour === hour))
                : [...profileSettings.availability, { day, hour }],
        });
    };

    const handleDelete = () => {
        if (deleteConfim == false) {
            setDeleteConfirm(true);
            return;
        }
        setDeleting(true);
        async function deleteAccount() {
            try {
                const result = await del("/settings/profile/delete_user");
                if (result.deleted == true) {
                    setDeleted(true);
                    const wait = setTimeout(async () => {
                        navigate('/login');
                    }, 2000);
                }
            } catch (err) {
                setStatusMessage(`${err}`)
            } finally {
                setDeleting(false);
                setDeleteConfirm(false);
            }
        }
        deleteAccount();
        return;
    }

    useEffect(() => {
        dialogRef.current?.showModal();
    }, [accountDeleted]);

    useEffect(() => {
        if (isLoading) return;
        if (isInitialLoad.current) {
            isInitialLoad.current = false;
            return;
        }

        setSaveStatus('saving');

        const timerId = setTimeout(async () => {
            try {
                const result = await patch('/settings/profile', profileSettings);
                setSaveStatus('saved');
                setStatusMessage('');
            } catch (err) {
                setStatusMessage(`${err}`);
                setSaveStatus('error');
            }
        }, 1500);
        
        return () => clearTimeout(timerId);
    }, [profileSettings, user, isLoading])

    if (isLoading) return <section className="relative flex-1 overflow-y-auto px-6 py-3 space-y-4"><p>Loading settings...</p></section>;

    return (
        <section className="relative flex-1 overflow-y-auto px-6 py-3 space-y-4 ">
            <dialog 
                onClose = {() => {navigate('/login')}}
                onClick={(e) => {
                    if (e.target === dialogRef.current) navigate('/login');
                }}
            >
                Account Deleted. You will be redirected to the login page.
            </dialog>
            <div>
                <h1 className='text-3xl font-bold tracking-tight text-slate-900'>Profile Settings</h1>
            </div>
            <div className='py-1'>
                {statusMessage && <p>{statusMessage}</p>}
                {saveStatus === 'saving' && 'Saving changes...'}
                {saveStatus === 'saved' && 'All changes saved.'}
                {saveStatus === 'error' && 'Failed to save changes.'}
            </div>
            <div className='w-128 space-y-4 shrink-0 max-w-full'>
                <Input
                    label='Display Name:'
                    id='display-name-input'
                    name='display_name'
                    maxLength={40}
                    value={profileSettings.display_name}
                    onChange={handleChange}
                />

                <Input
                    label='Email:'
                    id='email-input'
                    name='email'
                    maxLength={40}
                    value={profileSettings.email}
                    disabled
                />

                <Select 
                    label="Program of Study:"
                    id="program-of-study-select"
                    name="program"
                    onChange={handleChange}
                >
                    <option disabled hidden>Please select a program...</option>
                    {PROGRAMS.map((program) => (
                        <option key={program} value={program} selected={program == profileSettings.program}>
                            {program}
                        </option>
                    ))}
                </Select>

                <Select
                    label='Year of Study:'
                    id='year-of-study-select'
                    name="year"
                    onChange={handleChange}
                >
                    {YEARS.map((year) => (
                        <option key={`year-${year}`} value={year} selected={year == profileSettings.year}>
                            {year}
                        </option> 
                    ))}
                </Select>

                <Textarea
                    label='Bio:'
                    id='bio-input'
                    name='bio'
                    rows={3}
                    maxLength={500}
                    style={{ resize: 'none' }}
                    value={profileSettings.bio}
                    onChange={handleChange}
                />

                <fieldset>
                    <legend className="text-slate-700">Study Preferences:</legend>
                    <div className="flex gap-4">
                        <Checkbox
                            label='Quiet'
                            id='study-pref-quiet-radio'
                            name='study_style'
                            type='radio'
                            value='quiet'
                            checked={profileSettings.study_style === 'quiet'}
                            onChange={handleChange}
                        />
                        <Checkbox
                            label='Discussion'
                            id='study-pref-discussion-radio'
                            name='study_style'
                            type='radio'
                            value='discussion'
                            checked={profileSettings.study_style === 'discussion'}
                            onChange={handleChange}
                        />
                        <Checkbox
                            label='Mixed'
                            id='study-pref-mixed-radio'
                            name='study_style'
                            type='radio'
                            value='mixed'
                            checked={profileSettings.study_style === 'mixed'}
                            onChange={handleChange}
                        />
                    </div>
                </fieldset>
                
                <Input
                    label='Minimum Group Size:'
                    type='number'
                    id='min-group-size-input'
                    name='group_size_min'
                    min={2}
                    max={profileSettings.group_size_max - 1}
                    step={1}
                    maxLength={2}
                    value={profileSettings.group_size_min}
                    onChange={handleChange}
                 />

                <Input
                    label='Maximum Group Size:'
                    type='number'
                    id='max-group-size-input'
                    name='group_size_max'
                    min={profileSettings.group_size_min + 1}
                    max={20}
                    step={1}
                    maxLength={2}
                    value={profileSettings.group_size_max}
                    onChange={handleChange}
                 />

                <table className="w-full min-w-96 border-separate border-spacing-0 text-sm">
                    <caption>Availability</caption>
                    <thead>
                        <tr>
                            <th scope="col" className="sticky left-0 top-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-left font-medium text-slate-500">Time</th>
                            {DAYS.map(day => (
                                <th key={day} scope="col" className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-2 py-2 text-center font-medium text-slate-500">{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {HOURS.map(hour => (
                            <tr key={hour}>
                                <td className="sticky left-0 z-10 border-b border-r border-slate-100 bg-white px-2 py-2 text-xs text-slate-500">{hour}:00</td>
                                {DAYS.map((day, dayIndex) => (
                                    <td key={`${day}-${hour}`} className="border-b border-slate-100 p-0 text-center">
                                        <label className="flex h-9 cursor-pointer items-center justify-center hover:bg-brand/5 has-checked:bg-brand/10">
                                            <input
                                                type="checkbox"
                                                className="accent-brand"
                                                aria-label={`${day} ${hour}:00`}
                                                checked={availIsSelected(dayIndex, hour)}
                                                onChange={() => handleAvailabilityChange(dayIndex, hour)}
                                            />
                                        </label>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>

                <Input 
                    label="Search courses:"
                    id="search-course-input"
                    value={courseSearch}
                    onChange={(e) => setCourseSearch(e.target.value)}
                    type="text"
                />
                {coursesLoading ? (
                <p>Courses Loading...</p>
                ) : coursesError ? null : searchedCourses.length === 0 ? (
                    <p className="text-sm text-slate-500">No courses match "{courseSearch}".</p>
                    ) : (
                        <>
                            <p className="text-slate-900 text-medium">Results found:</p>
                            <div className="max-h-80 overflow-y-auto rounded-lg border-2 border-brand p-2">
                                <ul>
                                    {searchedCourses.map((course) => (
                                    <li key={course.id} className="px-2 py-2 hover:bg-slate-50">
                                        <Checkbox 
                                            type="checkbox" 
                                            label={`${course.code} - ${course.title}`}
                                            checked={profileSettings.course_ids.includes(course.id)}
                                            onChange={() => update({
                                                course_ids: profileSettings.course_ids.includes(course.id)
                                                    ? profileSettings.course_ids.filter(id => id !== course.id)
                                                    : [...profileSettings.course_ids, course.id]
                                            })}
                                        />
                                    </li>
                                    ))}
                                </ul>
                            </div>
                        </>
                    )}
                    {profileSettings.course_ids.length > 0 
                    ? <p className="text-slate-800">{profileSettings.course_ids.length} course(s) selected.</p> 
                    : <p className="text-slate-800">No courses selected.<span className="ml-1 text-red-600" aria-hidden="true">*</span>
                </p>}

                <div className='w-1/3 space-y-4'>
                <Button variant='primary' type='button' disabled={deleting} onClick={handleDelete} className={'hover:bg-red'}>
                    {deleteConfim ? 'Are you sure?' : deleting ? 'Deleting...' : accountDeleted ? 'Account Deleted' : 'Delete Account'}
                </Button>
            </div>
            </div>
        </section>
    )
}