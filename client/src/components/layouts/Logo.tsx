export function Logo() {
    return (
        <div className="flex items-center gap-3">
            <img src="/favicon.svg" className="h-8" alt="Tenjin Logo" />
            <span className="text-xl font-semibold text-slate-900">Tenjin</span>
        </div>
    );
}