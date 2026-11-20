import { useId } from 'react';
import { ErrorMessage } from './ErrorMessage';

type InputProps = React.ComponentProps<'input'> & { 
    label: string; 
    error?: string 
};

export function Input({ label, error, id, className, required, ...rest }: InputProps) {
    // If the user doesn't provide an id, generate one automatically.
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
        <div className="space-y-1">
            <label htmlFor={inputId} className="block text-sm font-medium text-slate-600">
                {label}
                {required && (
                    <span className="ml-1 text-red-600" aria-hidden="true">
                        *
                    </span>
                )}
            </label>
            <input id={inputId} {...rest} className={`w-full rounded-lg border border-slate-300 px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand ${className}`} />
            <ErrorMessage>{error}</ErrorMessage>
        </div>
    );
}