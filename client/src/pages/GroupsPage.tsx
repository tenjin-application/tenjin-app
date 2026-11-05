import AppNavbar from '../components/AppNavbar';

export default function GroupsPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <AppNavbar activePage="groups" />
            <main className="mx-auto max-w-screen-2xl px-6 py-10 sm:px-10 lg:px-14">
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Groups</h1>
                <p className="mt-3 text-slate-600">Explore and manage your study groups.</p>
            </main>
        </div>
    )
}