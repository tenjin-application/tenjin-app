type ButtonProps = React.ComponentProps<'button'> & {
    variant?: 'primary' | 'secondary'
};

export function Button({ variant='primary', className, children, ...rest }: ButtonProps) {
    // Changes the colors for the Button based on the provided variant.
    const colors = variant === 'primary'
        ? "bg-brand text-white border border-brand-dark hover:bg-brand-dark"
        : 'bg-white border border-slate-300 text-slate-800 hover:bg-slate-100';
    
    return (
        <button 
            {...rest} 
            className={`px-4 py-2 rounded-lg font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${colors} ${className}`}
        >{children}</button>
    );
}