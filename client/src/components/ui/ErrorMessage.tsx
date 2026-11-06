type ErrorMessageProps = React.ComponentProps<'p'>;

export function ErrorMessage({ children, ...rest}: ErrorMessageProps) {
    // There may not be any children (errors), thus we display nothing.
    if (!children) return null;

    return <p className="text-sm text-red-600" role="alert" {...rest}>{children}</p>;
}