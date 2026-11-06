import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom';

import { post, get } from '@/lib/api'
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AuthLayout } from '@/components/layouts/AuthLayout';
import loginBackground from '@/assets/login_background.png';

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [code, setCode] = useState('');
    const [step, setStep] = useState('email');
    const [error, setError] = useState('');
    const [checking, setChecking] = useState(true);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // On load, check if the user is already signed in.
    useEffect(() => {
        async function checkSession() {
            try {
                const result = await get('/auth/me');
                navigate(result.user.onboarded_at ? '/dashboard' : '/onboarding', { replace: true });
            } catch(error) {
                // Not logged in, we don't really care.
            } finally {
                setChecking(false);
            }
        }
        checkSession();
    }, []);

    async function handleEmailSubmit(e: React.SubmitEvent) {
        // Prevent default behavior, reset error.
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Attempt to submit the email to the server, before changing to our code step.
            const result = await post('/auth/request-code', { email });
            setStep('code');
            console.log(result);
        } catch (err) {
            // On error, log to the console, before setting the state error.
            console.log(err);
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    async function handleCodeSubmit(e: React.SubmitEvent) {
        // Prevent default behavior.
        e.preventDefault();
        setError('');
        setLoading(true);

        // Try to submit the email to the server.
        try {
            // Attempt to submit the code to the server, before navigating to either dashboard, or onboarding based on whether the user has already been onboarded.
            const result = await post('/auth/verify', { email, code });
            console.log(result);
            navigate(result.onboarded ? '/dashboard' : '/onboarding', { replace: true });
        } catch (err) {
            // On error, log to the console, before setting the state error.
            console.log(err);
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setLoading(false);
        }
    }

    if (checking) return <p>Loading...</p>
    
    return (
        <AuthLayout>
            <section className="relative flex flex-1 items-center justify-center px-6 py-12">
            <img
                src={loginBackground}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
            />

            <div className="absolute inset-0 bg-brand-dark/50" />

            <div className="relative w-full max-w-sm rounded-sm border border-gray-200 bg-white p-6 shadow-lg">
                <div className="mb-6 space-y-2 text-center">
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                            {step === 'email' ? 'Sign in to Tenjin' : 'Check your inbox'}
                        </h1>
                        <p>
                            {step === 'email'
                                ? "Enter your Ontario Tech email and a login code will be sent to you."
                                : `We sent a 6-digit code to ${email}`
                            }
                        </p>
                </div>
                {step === 'email' ? (
                    <form onSubmit={handleEmailSubmit} className="space-y-4">
                        <Input 
                            label="Email:"
                            error={error}
                            id="email-input"
                            type="email" 
                            placeholder="example.email@ontariotechu.net"
                            value={email} 
                            onChange={(e) => setEmail(e.target.value)} 
                        />
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? 'Sending...' : 'Send Email'}
                        </Button>
                    </form>
                ) : (
                    <div className="space-y-4">
                        <form onSubmit={handleCodeSubmit} className="space-y-4">
                            <Input 
                                label="Code:"
                                error={error}
                                id="code-input"
                                type="text" 
                                placeholder="Enter 6-digit code." 
                                value={code} 
                                onChange={(e) => setCode(e.target.value)} 
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                            />
                            <Button variant="primary" type="submit" disabled={loading}>
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </Button>
                        </form>
                        <button
                            type="button"
                            onClick={() => { setError(''); setCode(''); setStep('email')}}
                            className="w-full text-center text-sm text-brand hover:text-brand-dark"
                        >Return to Email</button>
                    </div>
                )}
            </div>
            </section>
            <aside className="hidden lg:flex lg:w-1/2 lg:items-center justify-center bg-brand-dark px-12 xl:px-20 text-white">
                <div className="max-w-md space-y-8">
                    <div className="h-1 w-22 rounded-full bg-accent" />

                    <div className="space-y-4">
                        <h2 className="text-6xl font-bold tacking-tight text-white">
                            Need a study group?
                        </h2>
                        <p className="text-lg leading-relaxed text-white/70">
                            Tenjin will match you with other Ontario Tech students based on 
                            a variety of factors, including: program, courses, availability, and more.
                        </p>
                    </div>

                    <ul className="space-y-5">
                        <li className="flex items-start gap-3">
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                            <div>
                                <p className="font-semibold text-white">Match by program and courses</p>
                                <p className="text-sm text-white/60">
                                    Grouped with classmates that are also taking your classes.
                                </p>
                            </div>
                        </li>

                        <li className="flex items-start gap-3">
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                            <div>
                                <p className="font-semibold text-white">Built to fit your schedule</p>
                                <p className="text-sm text-white/60">
                                    Schedule overlap is a consideration when matching with other users.
                                </p>
                            </div>
                        </li>

                        <li className="flex items-start gap-3">
                            <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-accent" />
                            <div>
                                <p className="font-semibold text-white">Choose the group size you want</p>
                                <p className="text-sm text-white/60">
                                    Groups can include a range of members, from two people all the way up to twenty.
                                </p>
                            </div>
                        </li>
                    </ul>
                </div>
            </aside>
        </AuthLayout>
    );
}