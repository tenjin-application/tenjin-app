import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { PROGRAMS } from '@shared/programs';
import type { StepProps } from './types';

const YEARS = [1, 2, 3, 4, 5, 6];

export function BasicsStep({ data, update }: StepProps) {
    return (
        <div>
            <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Basic information</h2>
                <Input 
                    label="Display Name:* "
                    id="display-name-input"
                    placeholder="e.g., John Doe..."
                    maxLength={40} 
                    required
                    value={data.displayName} 
                    onChange={(e) => update({ displayName: e.target.value })} 
                />

                <Select 
                    label="Program of Study:* "
                    id="program-of-study-select"
                    required
                    value={data.program}
                    onChange={(e) => update({ program: e.target.value })}
                >
                    <option value="" disabled hidden>Please select a program...</option>
                    {PROGRAMS.map((program) => (
                        <option key={program} value={program}>
                            {program}
                        </option>
                    ))}
                </Select>

                <Select
                    label="Year of Study:* "
                    id="year-of-study-select"
                    value={data.year}
                    onChange={(e) => update({ year: Number(e.target.value) })}
                >
                    {YEARS.map((year) => (
                        <option key={`year-${year}`} value={year}>
                            {year}
                        </option> 
                    ))}
                </Select>

                <Textarea 
                    label="Bio (optional):"
                    rows={4}
                    maxLength={500}
                    value={data.bio}
                    onChange={(e) => update({ bio: e.target.value })}
                    style={{ resize: 'none' }}
                    placeholder="e.g., There are catacombs hidden under every government building..."
                />
            </div>
        </div>
    );
}