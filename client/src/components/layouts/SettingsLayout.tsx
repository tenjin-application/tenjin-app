import { Outlet } from 'react-router-dom';
import SettingsNavbar from './SettingsNavbar';
import { useRequireUser } from '@/hooks/useRequireUser';

export function SettingsLayout() {
    const user = useRequireUser();
    if (!user) return <p>Loading...</p>;

    return (
        <div className="flex h-screen overflow-hidden bg-slate-50">
            <SettingsNavbar />
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}