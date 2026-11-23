import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
import { CheckboxGroup } from '@/components/ui/CheckboxGroup';

import type { StepProps } from './types';

// Constant array for determining the number of users.
const GROUPSIZE = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];

export function PreferencesStep({ data, update }: StepProps) {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-900">Preferences</h2>
            <CheckboxGroup 
                label="Study preferences:"
                required
            >
                <Checkbox 
                    label="Quiet" 
                    type="radio"
                    name="studyStyle" 
                    value="quiet"
                    checked={data.studyStyle === 'quiet'}
                    onChange={(e) => update({ studyStyle: e.target.value })} />
                <Checkbox 
                    label="Discussion" 
                    type="radio" 
                    name="studyStyle"
                    value="discussion"
                    checked={data.studyStyle === 'discussion'}
                    onChange={(e) => update({ studyStyle: e.target.value })} />
                <Checkbox 
                    label="Mixed" 
                    type="radio" 
                    name="studyStyle"
                    value="mixed"
                    checked={data.studyStyle === 'mixed'}
                    onChange={(e) => update({ studyStyle: e.target.value })} />
            </CheckboxGroup>

            <Select 
                label="Minimum Group Size:" 
                id="min-size-select"
                required
                value={data.groupSizeMin}
                onChange={(e) => update({ groupSizeMin: Number(e.target.value) })}
            >
                {GROUPSIZE.map((size) => (
                    <option key={`group-min-${size}`} value={size}>
                        {size}
                    </option> 
                ))}
            </Select>

            <Select 
                label="Maximum Group Size:" 
                id="max-size-select"
                required
                value={data.groupSizeMax}
                onChange={(e) => update({ groupSizeMax: Number(e.target.value) })}
                error={data.groupSizeMax < data.groupSizeMin ? "Your maximum group size must be greater than your minimum group size." : ''}
            >
                {GROUPSIZE.map((size) => (
                    <option key={`group-max-${size}`} value={size}>
                        {size}
                    </option> 
                ))}
            </Select>
        </div>
    );
}