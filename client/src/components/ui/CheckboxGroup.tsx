import { ErrorMessage } from './ErrorMessage';

type CheckboxGroupProps = {
    label: string;
    error?: string;
    required?: boolean;
    children: React.ReactNode;
}

export function CheckboxGroup({ label, error, required, children }: CheckboxGroupProps) {
    return (
        <fieldset className="space-y-2">
            <legend className="block text-sm font-medium text-slate-700">
                {label}
                {required && (
                    <span className="ml-1 text-red-600" aria-hidden="true">
                        *
                    </span>
                )}
            </legend>

            <div className="flex flex-col gap-2">{children}</div>

            <ErrorMessage>{error}</ErrorMessage>
        </fieldset>
    );
}