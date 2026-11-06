import { Link, NavLink } from 'react-router-dom';
import { Logo } from './Logo';

const links = [
  { label: 'Home', to: '/dashboard' },
  { label: 'Groups', to: '/groups' },
  { label: 'Settings', to: '/settings' },
] as const;

export default function AppNavbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-screen-2xl flex-wrap items-center justify-between gap-4 px-6 py-4">
        <Link to="/dashboard">
          <Logo />
        </Link>
        <nav className="flex flex-wrap items-center gap-x-7 gap-y-2 font-medium">
          {links.map(({ label, to }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/dashboard'}
              className={({ isActive }) =>
                isActive ? 'text-brand' : 'text-slate-700 transition hover:text-brand'
              }
            >
              {label}
            </NavLink>
          ))}
          <Link to="/login" className="text-slate-700 transition hover:text-brand">Log Out</Link>
        </nav>
      </div>
    </header>
  );
}