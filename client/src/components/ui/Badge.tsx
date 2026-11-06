// While technically a span, it is unique, thus we pass our own custom props.
type BadgeProps = {
    tone?: 'brand' | 'accent' | 'neutral';
    children: React.ReactNode;
};

// Possible tones for the badge.
const TONES = {
    brand: 'bg-brand/10 text-brand',
    accent: 'bg-accent/10 text-accent',
    neutral: 'bg-slate-100 text-slate-600',
} as const;

export function Badge({ tone = 'neutral', children }: BadgeProps) {
    return (
        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONES[tone]}`}>
            {children}
        </span>
    );
}