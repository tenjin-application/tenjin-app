import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { get } from '@/lib/api';
import type { User } from '@shared/types';

export function useRequireUser() {
    // Define states for the user, and a navigate router. the user state can only either be null, or shaped like our User type.
    const [user, setUser] = useState<User | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Essentially, gather the user, if not onboarded its sent to onboarding, it not a user or something goes wrong they're sent to the login, otherwise return user.
        // Returning user is how subsequent useEffects can update accordingly (by making the second argument [user]).
        async function checkUser() {
            try {
                const result = await get('/auth/me');
                if(!result.user.onboarded_at) {
                    navigate('/onboarding', { replace: true });
                } else {
                    setUser(result.user);
                }
            } catch {
                navigate('/login', { replace: true });
            } 
        }
        checkUser();
    }, []);

    return user;
}