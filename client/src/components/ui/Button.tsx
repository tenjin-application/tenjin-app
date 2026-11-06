type ButtonProps = React.ComponentProps<'button'> & {
    variant?: 'primary' | 'secondary'
};

export function Button({ variant='primary', className, children, ...rest }: ButtonProps) {
    // Changes the colors for the Button based on the provided variant.
    const colors = variant === 'primary'
        ? 'bg-brand text-white hover:bg-brand-dark'
        : 'bg-white border-2 border-gray-300 text-gray-800 hover:bg-gray-100';
    
    return (
        <button 
            {...rest} 
            className={`px-3 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed ${colors} ${className}`}
        >{children}</button>
    )
}