type InputProps = React.ComponentProps<'input'> & { 
    label: string; 
    error?: string 
};

export function Input({ label, error, id, ...rest }: InputProps) {
    return (
        <div className="space-y-1">
            <label htmlFor={id} className="block text-sm font-medium text-gray-700">{label}</label>
            <input id={id} {...rest} className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand" />
            {error && <p className="text-sm text-red-600">{error}</p>}
        </div>
    );
}