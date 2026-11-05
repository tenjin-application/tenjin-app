import { Link } from 'react-router-dom';

type AppNavbarProps = {
  activePage: 'dashboard' | 'groups' | 'settings';
};

const links = [
  { label: 'Home', to: '/dashboard', page: 'dashboard' },
  { label: 'Groups', to: '/groups', page: 'groups' },
  { label: 'Settings', to: '/settings', page: 'settings' },
] as const;

export default function AppNavbar({ activePage }: AppNavbarProps) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRzljv9IrVSiKCOM2YfuKRUv8DuJzCfq80jxwtIzR-G9Q&s=10" className="h-8" alt="Tenjin Logo" />
          <span className="text-xl font-semibold text-slate-900">Tenjin</span>
        </Link>
        <div className="flex flex-wrap items-center gap-x-7 gap-y-2 font-medium">
          {links.map(({ label, to, page }) => (
            <Link
              key={page}
              to={to}
              aria-current={activePage === page ? 'page' : undefined}
              className={activePage === page
                ? 'text-brand'
                : 'text-slate-700 transition hover:text-brand'}
            >
              {label}
            </Link>
          ))}
          <Link to="/login" className="text-slate-700 transition hover:text-brand">Log Out</Link>
        </div>
      </div>
    </nav>
  );
}
