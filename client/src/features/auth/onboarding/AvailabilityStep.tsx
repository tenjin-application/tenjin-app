import type { StepProps } from './types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];

export function AvailabilityStep({ data, update }: StepProps) {
    const isSelected = (day: number, hour: number) =>
        data.availability.some(slot => slot.day === day && slot.hour === hour);

    const toggleSlot = (day: number, hour: number) => {
        const selected = isSelected(day, hour);
        update({
            availability: selected
                ? data.availability.filter(slot => !(slot.day === day && slot.hour === hour))
                : [...data.availability, { day, hour }],
        });
    };

    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Availability</h2>
            <p className="text-sm text-gray-500">Pick the hours you're usually free to study (optional):</p>
            <div className="max-h-96 overflow-auto rounded-lg border border-gray-200">
                <table className="w-full min-w-96 border-separate border-spacing-0 text-sm">
                    <thead>
                        <tr>
                            <th scope="col" className="sticky left-0 top-0 z-20 border-b border-r border-gray-200 bg-gray-50 px-2 py-2 text-left font-medium text-gray-500">Time</th>
                            {DAYS.map(day => (
                                <th key={day} scope="col" className="sticky top-0 z-10 border-b border-gray-200 bg-gray-50 px-2 py-2 text-center font-medium text-gray-500">{day}</th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {HOURS.map(hour => (
                            <tr key={hour}>
                                <td className="sticky left-0 z-10 border-b border-r border-gray-100 bg-white px-2 py-2 text-xs text-gray-500">{hour}:00</td>
                                {DAYS.map((day, dayIndex) => (
                                    <td key={`${day}-${hour}`} className="border-b border-gray-100 p-0 text-center">
                                        <label className="flex h-9 cursor-pointer items-center justify-center hover:bg-brand/5 has-checked:bg-brand/10">
                                            <input
                                                type="checkbox"
                                                className="accent-brand"
                                                aria-label={`${day} ${hour}:00`}
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
        </div>
    );
}
