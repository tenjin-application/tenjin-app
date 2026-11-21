import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from '@/components/ui/Button';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { AuthLayout } from '@/components/layouts/AuthLayout';

import { get, patch } from '@/lib/api';

import { BasicsStep } from './onboarding/BasicsStep';
import { CoursesStep } from './onboarding/CoursesStep';
import { AvailabilityStep } from './onboarding/AvailabilityStep';
import { PreferencesStep } from './onboarding/PreferencesStep';

import type { OnboardingData } from './onboarding/types';
import type { Course } from '@shared/types';

export default function OnboardingPage() {
    // State related to the flow of data.
    const [step, setStep] = useState(0);
    const [data, setData] = useState<OnboardingData>({
        displayName: '', program: '', year: 1, bio: '', courseIds: [], availability: [], studyStyle: '', groupSizeMin: 2, groupSizeMax: 6,
    });
    const [courses, setCourses] = useState<Course[]>([]);

    // State related to the result of async or process of such operations.
    const [checking, setChecking] = useState(true);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [coursesError, setCoursesError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');

    // Navigate hook to swap users accordingly.
    const navigate = useNavigate();

    // Helper function pertaining to incrementally modify the OnboardingData object.
    const update = (changes: Partial<OnboardingData>) => setData(prev => ({ ...prev, ...changes}));

    const stepHeadings = [
        "Getting to know who you are...",
        `Hey ${data.displayName}! What courses are you currently taking?`,
        `What times work for you ${data.displayName}?`,
        `You're almost there. I just need a few more things...`,
    ];

    /**
     * Checks to see whether or not the info provided on each step is considered sufficient. Used to enable the forward tabulator.
     * @param {number} step - The current form step.
     * @returns {bool} Booleans corresponding to whether or not the input provided is deemed to be valid.
     */
    function isValidStep(step: number) {
        switch(step) {
            case 0:
                return data.displayName.trim() !== '' && data.program !== '';
            case 1:
                return data.courseIds.length > 0;
            case 2:
                return true;
            case 3:
                return data.studyStyle !== '' && data.groupSizeMin <= data.groupSizeMax;
            default:
                return false;
        }
    }

    /**
     * Attempts to submit the user input for their onboarding information, navigating accordingly, or providing errors.
     * @param {React.SubmitEvent} e - The  event corresponding to the submission.
     * @returns {void} Early return based on valid page forward tabulation.
     */
    async function handleSubmit(e: React.SubmitEvent) {
        e.preventDefault();

        // Since enter can technically submit the form prematurely, we disable it.
        // TODO: For accessibility sake, eventually optimize tab usage.
        if (step < 3) return;
        
        setSubmitError('');
        setSubmitting(true);

        try {
            await patch('/onboarding', data);
            navigate('/dashboard', { replace: true })
        } catch(err) {
            setSubmitError( err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    }

    useEffect(() => {
        // Checks the current logged in status of the user.
        async function checkSession() {
            try {
                const result = await get('/auth/me');
                if (result.user.onboarded_at) navigate ('/dashboard', { replace: true })
            } catch(error) {
                navigate('/login', { replace: true });
            } finally {
                setChecking(false);
            }
        }
        checkSession();
    }, []);

    useEffect(() => {
        // Attempts to load courses to be selected for the 2nd page of the form.
        async function loadCourses() {
            try {
                const result = await get('/courses');
                setCourses(result);
            } catch(err) {
                setCoursesError("Couldn't fetch, please try reloading.");
            } finally {
                setCoursesLoading(false);
            }
        }
        loadCourses();
    }, []);

    if (checking) return <p>Loading...</p>

    return (
        <AuthLayout>
            <section className="flex flex-col items-center justify-center gap-4 p-4">
                <h1 className="text-2xl text-center tracking-tight text-slate-900 font-bold">{submitting ? "Hang on tight!" : stepHeadings[step]}</h1>

                <form onSubmit={handleSubmit} className="flex flex-col justify-between max-w-xl w-full min-h-100 bg-white p-6 rounded-2xl border-2 border-slate-200 shadow-lg">
                    <div>
                        {step === 0 && (<BasicsStep data={data} update={update} />)}
                        {step === 1 && (<CoursesStep data={data} update={update} courses={courses} loading={coursesLoading} error={coursesError} />)}
                        {step === 2 && (<AvailabilityStep data={data} update={update} />)}
                        {step === 3 && (<PreferencesStep data={data} update={update} />)} 
                    </div>

                    <div className="space-y-2 my-2">
                        <div className="flex items-center justify-between text-sm text-slate-500">
                            <span className="font-medium text-brand-dark">
                                {['Basics', 'Courses', 'Availability', 'Preferences'][step]}
                            </span>
                            <span>Step {step + 1} of 4</span>
                        </div>

                        <div 
                            role="progressbar"
                            aria-valuenow={step + 1}
                            aria-valuemin={1}
                            aria-valuemax={4}
                            aria-label="Onboarding progress"
                            className="h-1.5 rounded-full bg-slate-200">
                            <div
                                className="h-1.5 rounded-full bg-linear-to-r from-brand via-brand-dark to-accent transition-all duration-300"
                                style={{ width: `${((step + 1) / 4) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-200 pt-5">
                        <Button 
                            type="button"
                            variant="secondary"
                            onClick={() => setStep((prev) => prev - 1)}
                            disabled={step <= 0}
                        >Back</Button>

                        {step < 3 ? (
                            <Button
                                key="continue"
                                type="button"
                                variant="primary"
                                onClick={() => setStep((prev) => prev + 1)}
                                disabled={!isValidStep(step) || submitting}
                            >Continue</Button>
                        ) : (
                            <Button 
                                key="finish"
                                type="submit" 
                                variant="primary" 
                                disabled={!isValidStep(step) || submitting}
                            >
                                {submitting ? 'Saving...' : 'Finish'}
                            </Button>
                        )}
                    </div>
                    {submitError && <ErrorMessage>{submitError}</ErrorMessage>}
                </form>
            </section>
        </AuthLayout>
    );
}