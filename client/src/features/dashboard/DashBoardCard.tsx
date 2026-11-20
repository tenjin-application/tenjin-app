import { useState } from 'react';

import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import type { Group } from '@shared/types';

// Type for the group card properties.
type GroupCardProps = {
    group: Group;
    onJoin: (groupId: number) => Promise<void>;
    onLeave: (groupId: number) => Promise<void>;
}

// Object for the possible combinations for the meeting labels.
const MEETING_LABELS = {
    in_person: 'In person',
    online: 'Online',
    hybrid: 'Hybrid'
}

export function GroupCard({ group, onJoin, onLeave }: GroupCardProps) {
    const [joining, setJoining] = useState(false);
    const [leaving, setLeaving] = useState(false);
    const [showLeaveConfirmation, setShowLeaveConfirmation] = useState(false);
    const [error, setError] = useState('');
    const isFull = group.member_count >= group.capacity;

    // Whenever the user clicks on the button to join or send a request.
    async function handleJoinClick() {
        // If the user attempt to join, we trigger the onRequest function (which triggers the modal to open to prompt the user for a request message).
        if (group.join_policy === 'request') {
            // onRequest(group);
            return;
        }
        
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

    async function handleLeaveClick() {
        setError('');
        setLeaving(true);
        try {
            await onLeave(group.id);
            setShowLeaveConfirmation(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Could not leave this group.');
        } finally {
            setLeaving(false);
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
        <article className="flex h-full flex-col gap-4 rounded-xl border-2 border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-brand hover:shadow-md">
            <p className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium text-brand">{group.course_code ?? 'General'}</span>
                <Badge tone="neutral">{MEETING_LABELS[group.meeting_mode]}</Badge>
            </p>

            <h3 className="text-lg font-semibold text-slate-900">{group.name}</h3>

            <p className="line-clamp-3 text-sm leading-6 text-slate-600">
                {group.description ?? 'No description provided.'}
            </p>

            <div className="mt-auto space-y-3 pt-2">
                <p className="flex items-center justify-between text-sm text-slate-500">
                    <span className={isFull ? 'font-medium text-accent' : ''}>
                        {group.member_count} / {group.capacity} members
                    </span>
                </p>

                <>
                    <p className="text-sm text-slate-500">Compatibility: {group.score}%</p>
                    <div className="h-1.5 rounded-full bg-slate-200">
                        <div
                            className="h-1.5 rounded-full bg-linear-to-r from-brand via-brand-dark to-accent transition-all duration-300"
                            style={{ width: `${group.score}%` }}
                        />
                    </div>
                </>

                <Button
                    onClick={handleJoinClick}
                    disabled={joining || group.is_member || group.has_pending_request || isFull}
                    className="w-full"
                >
                    {isFull && !group.is_member ? 'Group full' : buttonLabel}
                </Button>
                {group.is_member && !group.is_owner && (
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowLeaveConfirmation(true)}
                        disabled={leaving}
                        className="w-full"
                    >
                        Leave group
                    </Button>
                )}
            </div>
            {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
            <Modal
                open={showLeaveConfirmation}
                onClose={() => setShowLeaveConfirmation(false)}
                title="Leave group?"
            >
                <p className="text-sm text-slate-600">
                    Are you sure you want to leave {group.name}? You can request to join again later.
                </p>
                <div className="mt-6 flex justify-end gap-3">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setShowLeaveConfirmation(false)}
                        disabled={leaving}
                    >
                        Cancel
                    </Button>
                    <Button type="button" onClick={() => void handleLeaveClick()} disabled={leaving}>
                        {leaving ? 'Leaving...' : 'Leave group'}
                    </Button>
                </div>
            </Modal>
        </article>
    );
}