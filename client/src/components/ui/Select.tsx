import { useId } from 'react';
import { ErrorMessage } from './ErrorMessage';

type SelectProps = React.ComponentProps<'select'> & { 
    label: string 
    error?: string
};

export function Select({ label, error, id, children, className='', required, ...rest }: SelectProps) {
    // If the user doesn't provide an id, generate one automatically.
    const generatedId = useId();
    const inputId = id ?? generatedId;
    const errorId = `${inputId}-error`;

    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={inputId}  className="block text-sm font-medium text-slate-700">
                {label}
                {required && (
                    <span className="ml-1 text-red-600" aria-hidden="true">
                        *
                    </span>
                )}
            </label>

            <select 
                id={inputId}
                required={required}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? errorId : undefined}
                className={`w-full rounded-lg border bg-white px-4 py-2 text-slate-900 focus:outline-none focus:ring-2 ${
                    error
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-slate-300 focus:ring-brand'
                } ${className}`}
                {...rest}
            >
                {children}
            </select>

            <ErrorMessage id={errorId}>{error}</ErrorMessage>
        </div>
    )
}