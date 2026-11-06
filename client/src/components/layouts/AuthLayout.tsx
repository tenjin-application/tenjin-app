import Footer from './Footer';
import { Logo } from './Logo';

export function AuthLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen flex-col bg-slate-50">
            <header className="sticky top-0 z-50 border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-screen-2xl items-center px-6 py-4">
                    <Logo />
                </div>
            </header>
            <main className="flex flex-1">{children}</main>
            <Footer />
        </div>
    );
}