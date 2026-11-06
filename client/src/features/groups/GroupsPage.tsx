import { useEffect, useState } from 'react';
import type { Group } from '@shared/types';
import { get, post } from '@/lib/api';
import { GroupCard } from './GroupCard';
import { ErrorMessage } from '@/components/ui/ErrorMessage';

export default function GroupsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        async function loadGroups() {
            try {
                const result = await get('/groups');
                setGroups(result);
            } catch {
                setError("Couldn't load groups, please try reloading.");
            } finally {
                setLoading(false);
            }
        }
        loadGroups();
    }, []);

    async function handleJoin(groupId: number) {
        const result = await post(`/groups/${groupId}/join`);

        setGroups((prev) => prev.map((g) => {
            if (g.id !== groupId) return g;
            return result.status === 'joined'
                ? { ...g, is_member: true, member_count: g.member_count + 1 }
                : { ...g, has_pending_request: true };
        }));
    }

    return (
        <div className="mx-auto max-w-screen-2xl px-6 py-10 sm:px-10 lg:px-14">
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">Groups</h1>
            <p className="mt-3 text-slate-600">Explore and manage your study groups.</p>

            {loading ? (
                <p className="mt-6 text-slate-600">Loading groups...</p>
            ) : error ? (
                <ErrorMessage>{error}</ErrorMessage>
            ) : groups.length === 0 ? (
                <p className="mt-6 text-slate-600">No groups yet. Be the first to create one.</p>
            ) : (
                <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {groups.map((group) => (
                        <GroupCard key={group.id} group={group} onJoin={handleJoin} />
                    ))}
                </div>
            )}
        </div>
    );
}