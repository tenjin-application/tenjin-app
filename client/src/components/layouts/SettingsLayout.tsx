import { Outlet } from 'react-router-dom';
import Footer from './Footer';
import SettingsNavbar from './SettingsNavbar';
import { useRequireUser } from '@/hooks/useRequireUser';

export function SettingsLayout() {
    const user = useRequireUser();
    if (!user) return <p>Loading...</p>;

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <SettingsNavbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}