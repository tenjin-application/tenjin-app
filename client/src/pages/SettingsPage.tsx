import AppNavbar from '../components/AppNavbar';

export default function SettingsPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <AppNavbar activePage="settings" />
            <main className="mx-auto max-w-screen-2xl px-6 py-10 sm:px-10 lg:px-14">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
                <p className="mt-3 text-slate-600">Manage your account preferences.</p>
            </main>
        </div>
    )
}