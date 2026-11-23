import { useId } from 'react';
import { ErrorMessage } from './ErrorMessage';

type TextareaProps = React.ComponentProps<'textarea'> & {
    label: string;
    error?: string;
    hint?: string;
};

export function Textarea({ label, error, hint, id, className='', required, rows=4, ...rest }: TextareaProps) {
    // If the user doesn't provide an id, generate one automatically.
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    // Because a textarea can be further described by more than one extra field, we filter and join the available means.
    const describedBy = [
        error ? errorId : null,
        hint ? hintId : null
    ].filter(Boolean).join(' ') || undefined;

    return (
        <div className="space-y-1">
            <label htmlFor={inputId} className="block text-sm font-medium text-slate-700">
                {label}
                {required && (
                    <span className="ml-1 text-red-600" aria-hidden="true">
                        *
                    </span>
                )}
            </label>

            <textarea 
                id={inputId} 
                rows={rows}
                required={required}
                aria-invalid={Boolean(error)}
                aria-describedby={describedBy}
                className={`w-full resize-y rounded-lg border px-4 py-2 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 ${
                    error
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-300 focus:ring-brand'
                } ${className}`}
                {...rest} 
            />

            <div className="flex items-start justify-between gap-2">
                <ErrorMessage id={errorId}>{error}</ErrorMessage>
                {hint && (
                    <p id={hintId} className="ml-auto text-xs text-slate-500">
                        {hint}
                    </p>
                )}
            </div>
        </div>
    )
}