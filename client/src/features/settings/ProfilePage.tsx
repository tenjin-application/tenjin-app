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

const YEARS = [1, 2, 3, 4, 5, 6] as const;
type Years = (typeof YEARS)[number];

interface ProfileSettings {
    display_name: string;
    email: string;
    program: string;
    year: Years;
    bio: string;
    study_style: 'quiet' | 'discussion' | 'mixed' | '';
    group_size_min: number;
    group_size_max: number;
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
        group_size_max: 0
    })
    const [statusMessage, setStatusMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const isInitialLoad = useRef<boolean>(true);
    const user = useRequireUser();

    useEffect(() => {
        let enabled = true;
        
        async function loadSettings() {
            try {
                const result = await get('/auth/me');
                console.log("hello world");
                if (enabled) {
                    setProfileSettings(result.user);
                }
            } catch (err) {
                if (enabled) setStatusMessage("help me");
            } finally {
                if (enabled) setIsLoading(false);
            }
        }
    
        loadSettings();
        return () => {
            enabled = false;
          };
      }, []);

    const handleChange = (element: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = element.target;
        const isCheckbox = element.target instanceof HTMLInputElement && type === 'checkbox';
        setProfileSettings((prev) => ({
            ...prev,
            [name]: isCheckbox ? (element.target as HTMLInputElement).checked : (name == 'year' ? Number(value) : value),
        }));
    };

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
                console.log(result);
                setSaveStatus('saved');
            } catch (err) {
                setStatusMessage(`${err}`);
                setSaveStatus('error');
            }
        }, 1700);
        
        return () => clearTimeout(timerId);
    }, [profileSettings, user, isLoading])

    if (isLoading) return <section className="relative flex-1 overflow-y-auto px-6 py-3 space-y-4"><p>Loading settings...</p></section>;

    return (
        <section className="relative flex-1 overflow-y-auto px-6 py-3 space-y-4">

            <div>
                <h1 className='text-3xl font-bold tracking-tight text-slate-900'>Profile Settings</h1>
            </div>
            <div className='w-1/3 space-y-4'>
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
            </div>
            {statusMessage && <p>{statusMessage}</p>}
            {saveStatus === 'saving' && 'Saving changes...'}
            {saveStatus === 'saved' && 'All changes saved.'}
            {saveStatus === 'error' && 'Failed to save changes.'}
        </section>
    )
}