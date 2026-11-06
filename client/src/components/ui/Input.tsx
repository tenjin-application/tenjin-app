import { useId } from 'react';
import { ErrorMessage } from './ErrorMessage';

type InputProps = React.ComponentProps<'input'> & { 
    label: string; 
    error?: string 
};

export function Input({ label, error, id, ...rest }: InputProps) {
    // If the user doesn't provide an id, generate one automatically.
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
        <div className="space-y-1">
            <label htmlFor={inputId} className="block text-sm font-medium text-gray-700">{label}</label>
            <input id={inputId} {...rest} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand" />
            <ErrorMessage>{error}</ErrorMessage>
        </div>
    );
}