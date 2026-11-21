import { NavLink } from 'react-router-dom';

const links = [
    { label: "General", to: "general" },
    { label: "Profile", to: "profile" },
    { label: "Notifications", to: "notifications" },
    { label: "Accessibility", to: "accessibility" }
] as const;

export default function SettingsNavbar() {
    return (
            <header className="sticky top-0 h-screen w-64 shrink-0 overflow-y-auto border-r border-slate-200 bg-white">
                  <div className="flex flex-col gap-4 px-6 py-4">
                    <nav className="flex flex-col gap-y-2 font-medium">
                      {links.map(({ label, to }) => (
                        <NavLink
                          key={to}
                          to={to}
                          className={({ isActive }) =>
                            isActive ? 'text-brand' : 'text-slate-700 transition hover:text-brand'
                          }
                        >
                          {label}
                        </NavLink>
                      ))}
                    </nav>
                  </div>
                </header>
    )
}