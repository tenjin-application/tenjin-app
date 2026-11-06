import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { get, patch } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { BasicsStep } from './onboarding/BasicsStep';
import { CoursesStep } from './onboarding/CoursesStep';
import { AvailabilityStep } from './onboarding/AvailabilityStep';
import { PreferencesStep } from './onboarding/PreferencesStep';
import type { OnboardingData } from './onboarding/types';
import type { Course } from '@shared/types';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import onboardingBackground from '@/assets/onboarding_background.png';

export default function OnboardingPage() {
    const [step, setStep] = useState(0);
    const [data, setData] = useState<OnboardingData>({
        displayName: '', program: '', year: 1, bio: '', courseIds: [], availability: [], studyStyle: '', groupSizeMin: 2, groupSizeMax: 6,
    });
    const [checking, setChecking] = useState(true);
    const [courses, setCourses] = useState<Course[]>([]);
    const [coursesLoading, setCoursesLoading] = useState(true);
    const [coursesError, setCoursesError] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState('');
    const navigate = useNavigate();

    // Helper function pertaining to incrementally modify the OnboardingData object.
    const update = (changes: Partial<OnboardingData>) => setData(prev => ({ ...prev, ...changes}));

    // Handles submit logic, 
    async function handleSubmit(e: React.SubmitEvent) {
        e.preventDefault();

        // Since enter can technically submit the form prematurely, this simulates a 'chunked form' so to speak. It will simply jump to the next step if valid.
        if (step < 3) {
            const result = isValidStep(step);
            if (result) setStep((prev) => prev + 1);
            return;
        }
        
        // Set the submit error to '', and submitting to true.
        setSubmitError('');
        setSubmitting(true);

        // Essentially, we try to query the router, sending the data we provided.
        // On success the user is navigated to the dashboard. On error the user is informed, and submitting is set back to false.
        try {
            await patch('/onboarding', data);
            navigate('/dashboard', { replace: true })
        } catch(err) {
            setSubmitError( err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setSubmitting(false);
        }
    }

    // Steps are numbered, thus we just validate using a switch cases for whatever page, and requirements.
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

    // Use effect for checking whether or not the user is logged in, or has onboarded.
    useEffect(() => {
        async function checkSession() {
            try {
                // Tries to check if the user is logged in, if so, and has onboarded, redirect to dashboard.
                const result = await get('/auth/me');
                if (result.user.onboarded_at) navigate ('/dashboard', { replace: true })
            } catch(error) {
                // Not logged in, redirect back to login.
                navigate('/login', { replace: true });
            } finally {
                // No longer checking, set to false.
                setChecking(false);
            }
        }
        checkSession();
    }, []);

    // Use effect for loading the courses for step 2 of the onboarding process.
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

    // While we check if the user is logged in.
    if (checking) return <p>Loading...</p>

    // TODO: Some weird submit bug, will fix later.
    return (
        <AuthLayout>
            <section className="relative flex flex-1 items-center justify-center px-6 py-12">
                <img
                    src={onboardingBackground}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-brand-dark/50" />

                <form onSubmit={handleSubmit} className="relative max-w-full w-lg  bg-white p-6 rounded-2xl border-2 border-brand">
                    {step === 0 && (<BasicsStep data={data} update={update} />)}
                    {step === 1 && (<CoursesStep data={data} update={update} courses={courses} loading={coursesLoading} error={coursesError} />)}
                    {step === 2 && (<AvailabilityStep data={data} update={update} />)}
                    {step === 3 && (<PreferencesStep data={data} update={update} />)} 

                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm text-gray-500">
                            <span className="font-medium text-gray-700">
                                {['Basics', 'Courses', 'Availability', 'Preferences'][step]}
                            </span>
                            <span>Step {step + 1} of 4</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-200">
                            <div
                                className="h-1.5 rounded-full bg-brand transition-all duration-300"
                                style={{ width: `${((step + 1) / 4) * 100}%` }}
                            />
                        </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-5">
                        
                        <Button 
                            type="button"
                            variant="secondary"
                            onClick={() => setStep((prev) => prev - 1)}
                            disabled={step <= 0}
                        >Back</Button>

                        {step < 3 ? (
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => setStep((prev) => prev + 1)}
                                disabled={!isValidStep(step)}
                            >Continue</Button>
                        ) : (
                            <Button type="submit" variant="primary" disabled={!isValidStep(step) || submitting}>
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