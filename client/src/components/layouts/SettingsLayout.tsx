import { Outlet } from 'react-router-dom';
import SettingsNavbar from './SettingsNavbar';
import AppNavbar from './AppNavbar';
import Footer from './Footer';
import { useRequireUser } from '@/hooks/useRequireUser';

export function SettingsLayout() {
    const user = useRequireUser();
    if (!user) return <p>Loading...</p>;

    return (
        <div className="flex h-screen flex-col bg-slate-50">
            <AppNavbar />
            <div className="flex h-screen overflow-hidden bg-slate-50">
                <SettingsNavbar />
                <div className="flex-1 overflow-y-auto">
                    <main className="flex-grow min-h-screen">
                        <Outlet />
                    </main>
                    <Footer />
                </div>
            </div>
        </div>
        
    );
}