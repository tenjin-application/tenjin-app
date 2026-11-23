import Github from '@/assets/GitHub_Invertocat_Black.svg';

export default function Footer() {
    return (
        <footer className="flex flex-col items-center justify-center gap-3 border-t border-slate-200 bg-white px-4 py-6 text-center text-sm text-slate-500">
            <p className="text-slate-600">
                <i>"The days will fly by if I don't work harder."</i> 
                <br />
                - Sugawara no Michizane (Tenjin)
            </p>
            <a
                href="https://github.com/tenjin-application/tenjin-app"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Tenjin GitHub Repository"
            >
                <img src={Github} className="h-7 opacity-80 hover:opacity-100" alt="GitHub" />
            </a>
            <p className="max-w-md text-xs text-slate-400">
                Tenjin is an independent student project built to connect Ontario Tech students and study groups together, and is not affiliated with Ontario Tech University.
            </p>
        </footer>
    );
}