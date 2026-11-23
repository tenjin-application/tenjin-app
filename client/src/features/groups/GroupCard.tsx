import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

import type { Group } from '@shared/types';

// Type for the group card properties.
type GroupCardProps = {
    group: Group;
    onJoin: (groupId: number) => Promise<void>;
    onRequest: (group: Group) => void;
}

// Object for the possible combinations for the meeting labels.
const MEETING_LABELS = {
    in_person: 'In person',
    online: 'Online',
    hybrid: 'Hybrid'
}

export function GroupCard({ group, onJoin, onRequest }: GroupCardProps) {
    const [joining, setJoining] = useState(false);
    const [error, setError] = useState('');
    const isFull = group.member_count >= group.capacity;

    // Whenever the user clicks on the button to join or send a request.
    async function handleJoinClick() {
        // If the user attempt to request to join, we trigger the onRequest function (which triggers the modal to open to prompt the user for a request message).
        if (group.join_policy === 'request') {
            onRequest(group);
            return;
        }
        
        // Otherwise the user is joining.
        setError('');
        setJoining(true);
        try {
            await onJoin(group.id);
        } catch(err) {
            setError(err instanceof Error ? err.message : 'Something went wrong');
        } finally {
            setJoining(false);
        }
    }

    // Simple condition to help determine the text for the button.
    const buttonLabel = group.is_member
        ? 'Already joined'
        : group.join_policy === 'open'
            ? (joining ? 'Joining...' : 'Join group')
            : group.has_pending_request
                ? 'Request sent'
                : 'Request to join';

    return(
        <article className="flex h-full flex-col gap-4 rounded-2xl border-2 border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium text-brand">{group.course_code ?? 'General'}</span>
                <Badge tone="accent">{MEETING_LABELS[group.meeting_mode]}</Badge>
            </div>

            <h2 className="text-lg font-semibold text-slate-900">{group.name}</h2>

            <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                {group.description?.trim() ?? 'No description provided.'}
            </p>

            <div className="mt-auto space-y-3 pt-2">
                <p className="flex items-center justify-between text-sm text-slate-500">
                    <span className={isFull ? 'font-medium text-accent' : ''}>
                        {group.member_count} / {group.capacity} members
                    </span>
                    <span className="">
                        {group.score}% Compatibility
                    </span>
                </p>

                <div 
                    role="progressbar"
                    aria-valuenow={group.score}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label="Group compatibility score"
                    className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200"
                >
                    <div
                        className="h-full rounded-full bg-linear-to-r from-brand via-brand-dark to-accent transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, group.score))}%` }}
                    />
                </div>

                <Button
                    onClick={handleJoinClick}
                    disabled={joining || group.is_member || group.has_pending_request || isFull}
                    className="w-full"
                >
                    {isFull && !group.is_member ? 'Group full' : buttonLabel}
                </Button>
            </div>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
        </article>
    );
}