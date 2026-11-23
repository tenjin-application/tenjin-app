// Omit allows for type overriding.
type CheckboxProps = Omit<React.ComponentProps<'input'>, 'type'> & {
    label: string;
    type?: 'checkbox' | 'radio';
};

export function Checkbox({ label, type="checkbox", className='',  ...rest}: CheckboxProps) {
    // NOTE: We implicitly wrap label around the checkbox because we want the label to also constitute as a clickable area.
    return (
        <label className={`flex cursor-pointer select-none items-center gap-2.5 text-sm text-slate-900`}>
            <input 
                type={type} 
                className="h-4 w-4 shrink-0 accent-brand focus:ring-2 focus:ring-brand"
                {...rest} />
            <span>{label}</span>
        </label>
    );
}