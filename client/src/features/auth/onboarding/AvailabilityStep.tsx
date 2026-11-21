import { Button } from '@/components/ui/Button';
import type { StepProps } from './types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export function AvailabilityStep({ data, update }: StepProps) {
    // Helper to check to see if some availability was checked.
    const isSelected = (day: number, hour: number) =>
        data.availability.some(slot => slot.day === day && slot.hour === hour);

    // Helper to help narrow down which slot to toggle.
    const toggleSlot = (day: number, hour: number) => {
        const selected = isSelected(day, hour);
        update({
            availability: selected
                ? data.availability.filter(slot => !(slot.day === day && slot.hour === hour))
                : [...data.availability, { day, hour }],
        });
    };

    // Avoids displaying the hour in military time.
    const formatHour = (hour: number) => {
        const period = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour % 12 || 12;
        return `${displayHour}:00 ${period}`;
    }

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Availability</h2>
            <p className="text-sm text-slate-500">Pick the hours you're usually free to study (optional):</p>
            <div className="overflow-auto max-h-72 rounded-lg border border-slate-200">
                <table className="w-full border-separate border-spacing-0 text-sm">
                    <thead>
                        <tr>
                            <th scope="col" className="sticky left-0 top-0 z-20 border-b border-r border-slate-200 bg-slate-50 px-2 py-2 text-left font-medium text-slate-500">Time</th>
                            {DAYS.map(day => (
                                <th key={day} scope="col" className="sticky top-0 z-10 border-b border-slate-200 bg-slate-50 px-2 py-2 text-center font-medium text-slate-500">{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {HOURS.map(hour => (
                            <tr key={hour}>
                                <td className="sticky whitespace-nowrap left-0 z-10 border-b border-r border-slate-100 bg-white px-2 py-2 text-xs text-slate-500">{formatHour(hour)}</td>
                                {DAYS.map((day, dayIndex) => (
                                    <td key={`${day}-${hour}`} className="border-b border-slate-100 p-0 text-center">
                                        <label className="flex h-9 cursor-pointer items-center justify-center hover:bg-brand/5 has-checked:bg-brand/10">
                                            <input
                                                type="checkbox"
                                                className="accent-brand"
                                                aria-label={`${day} ${formatHour(hour)}`}
                                                checked={isSelected(dayIndex, hour)}
                                                onChange={() => toggleSlot(dayIndex, hour)}
                                            />
                                        </label>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {data.availability.length > 0 ? (
                <div className="flex items-center justify-between">
                    <p className="text-sm text-slate-800">
                        {data.availability.length} hour(s) selected.
                    </p>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => update({ availability: [] })}
                    >
                        Clear
                    </Button>
                </div>
            ) : (
                <p className="text-sm text-slate-800">No hours selected.</p>
            )}
        </div>
    );
}
