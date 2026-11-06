import { Outlet } from 'react-router-dom';
import { useRequireUser } from '@/hooks/useRequireUser';
import AppNavbar from './AppNavbar';
import Footer from './Footer';

export function AppLayout() {
    const user = useRequireUser();
    if (!user) return <p>Loading...</p>;

    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <AppNavbar />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
}