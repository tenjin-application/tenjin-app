import { useState, useEffect } from 'react'
import { post, get } from '../lib/api'
import { useNavigate } from 'react-router-dom';

import { Input } from '../components/Input.tsx';
import { Button } from '../components/Button.tsx';

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
        step === 'email' ? (
            <form onSubmit={handleEmailSubmit}>
                <Input 
                    label="Email: "
                    error={error}
                    id="email-input"

                    type="email" 
                    placeholder="example.email@ontariotechu.net"
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                />
                <Button variant="primary" type="submit" disabled={loading}>Send Email</Button>
            </form>
        ) : (
            <>
                <form onSubmit={handleCodeSubmit}>
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
                    <Button variant="primary" type="submit" disabled={loading}>Verify Code</Button>
                </form>
                <Button variant="secondary" type="button" onClick={() => {setError(''); setCode(''); setStep('email') }}>Return to Email</Button>
            </>
        )
    );
}