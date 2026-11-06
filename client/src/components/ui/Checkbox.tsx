// Omit allows for type overriding.
type CheckboxProps = Omit<React.ComponentProps<'input'>, 'type'> & {
    label: string;
    type?: 'checkbox' | 'radio';
};

export function Checkbox({ label, type="checkbox", ...rest}: CheckboxProps) {
    // NOTE: We implicitly wrap label around the checkbox because we want the label to also constitute as a clickable area.
    return (
        <label className="flex items-center gap-2">
            <input type={type} {...rest} />
            {label}
        </label>
    );
}