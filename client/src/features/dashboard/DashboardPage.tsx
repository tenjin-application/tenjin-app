import { useEffect, useRef, useState } from 'react';
import { del, get, patch, post } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import type { GroupMember } from '@shared/types';

type DashboardGroup = {
  id: number;
  name: string;
  is_owner: boolean;
  meeting_mode: 'in_person' | 'online' | 'hybrid';
  course_code: string | null;
  chat_url: string | null;
};

type DashboardNotification = {
  id: number;
  type: 'joined' | 'left' | 'kicked' | 'request_accepted' | 'request_declined' | 'new_request';
  read_at: string | null;
  created_at: string;
  group_name: string | null;
  actor_name: string | null;
};

type GroupJoinRequest = {
  id: number;
  group_id: number;
  message: string | null;
  created_at: string;
  group_name: string;
  requester_name: string | null;
};

interface DashboardResponse {
  groups: DashboardGroup[];
  notifications: DashboardNotification[];
  requests: GroupJoinRequest[];
}

export default function DashboardPage() {
  const [groups, setGroups] = useState<DashboardGroup[]>([]);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [joinRequests, setJoinRequests] = useState<GroupJoinRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requestActionId, setRequestActionId] = useState<number | null>(null);
  const [requestError, setRequestError] = useState('');
  const [notificationAction, setNotificationAction] = useState<string | null>(null);
  const [notificationError, setNotificationError] = useState('');
  const [managingGroup, setManagingGroup] = useState<DashboardGroup | null>(null);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersError, setMembersError] = useState('');
  const [memberToRemove, setMemberToRemove] = useState<GroupMember | null>(null);
  const [removingMemberId, setRemovingMemberId] = useState<number | null>(null);
  const membersRequestId = useRef(0);
  const [groupToLeave, setGroupToLeave] = useState<DashboardGroup | null>(null);
  const [leavingGroupId, setLeavingGroupId] = useState<number | null>(null);
  const [leaveGroupError, setLeaveGroupError] = useState('');

  useEffect(() => {
    let active = true;

    async function loadDashboard() {
      try {
        const result = (await get('/dashboard')) as DashboardResponse;
        if (active) {
          setGroups(result.groups);
          setNotifications(result.notifications);
          setJoinRequests(result.requests);
          setError('');
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Could not load your groups.');
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    function refreshWhenVisible() {
      if (document.visibilityState === 'visible') void loadDashboard();
    }

    void loadDashboard();
    const refreshInterval = window.setInterval(loadDashboard, 30_000);
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, []);

  const hasNewNotifications = notifications.some((notification) => notification.read_at === null);

  async function handleOpenMembers(group: DashboardGroup) {
    const requestId = ++membersRequestId.current;
    setManagingGroup(group);
    setGroupMembers([]);
    setMembersError('');
    setMemberToRemove(null);
    setMembersLoading(true);
    try {
      const result = await get(`/groups/${group.id}/members`);
      if (membersRequestId.current === requestId) setGroupMembers(result);
    } catch (err) {
      if (membersRequestId.current === requestId) {
        setMembersError(err instanceof Error ? err.message : 'Could not load group members.');
      }
    } finally {
      if (membersRequestId.current === requestId) setMembersLoading(false);
    }
  }

  function handleCloseMembers() {
    membersRequestId.current += 1;
    setManagingGroup(null);
    setMemberToRemove(null);
  }

  async function handleRemoveMember() {
    if (!managingGroup || !memberToRemove) return;

    setRemovingMemberId(memberToRemove.id);
    setMembersError('');
    try {
      await del(`/groups/${managingGroup.id}/members/${memberToRemove.id}`);
      setGroupMembers((current) => current.filter((member) => member.id !== memberToRemove.id));
      setMemberToRemove(null);
    } catch (err) {
      setMembersError(err instanceof Error ? err.message : 'Could not remove this group member.');
    } finally {
      setRemovingMemberId(null);
    }
  }

  async function handleLeaveGroup() {
    if (!groupToLeave) return;

    setLeavingGroupId(groupToLeave.id);
    setLeaveGroupError('');
    try {
      await post(`/groups/${groupToLeave.id}/leave`);
      setGroups((current) => current.filter((group) => group.id !== groupToLeave.id));
      setJoinRequests((current) => current.filter((request) => request.group_id !== groupToLeave.id));
      setGroupToLeave(null);
    } catch (err) {
      setLeaveGroupError(err instanceof Error ? err.message : 'Could not leave this group.');
    } finally {
      setLeavingGroupId(null);
    }
  }

  async function handleRequestDecision(request: GroupJoinRequest, decision: 'accepted' | 'declined') {
    setRequestActionId(request.id);
    setRequestError('');
    try {
      await post(`/groups/${request.group_id}/requests/${request.id}`, { decision });
      setJoinRequests((current) => current.filter((item) => item.id !== request.id));
    } catch (err) {
      setRequestError(err instanceof Error ? err.message : 'Could not update this join request.');
    } finally {
      setRequestActionId(null);
    }
  }

  async function handleMarkNotificationRead(notification: DashboardNotification) {
    setNotificationAction(`read-${notification.id}`);
    setNotificationError('');
    try {
      const result = await patch(`/dashboard/notifications/${notification.id}/read`);
      setNotifications((current) => current.map((item) => (
        item.id === notification.id ? { ...item, read_at: result.notification.read_at } : item
      )));
    } catch (err) {
      setNotificationError(err instanceof Error ? err.message : 'Could not mark notification as read.');
    } finally {
      setNotificationAction(null);
    }
  }

  async function handleDeleteNotification(notificationId: number) {
    setNotificationAction(`delete-${notificationId}`);
    setNotificationError('');
    try {
      await del(`/dashboard/notifications/${notificationId}`);
      setNotifications((current) => current.filter((item) => item.id !== notificationId));
    } catch (err) {
      setNotificationError(err instanceof Error ? err.message : 'Could not delete notification.');
    } finally {
      setNotificationAction(null);
    }
  }

  async function handleClearNotifications() {
    setNotificationAction('clear');
    setNotificationError('');
    try {
      await del('/dashboard/notifications');
      setNotifications([]);
    } catch (err) {
      setNotificationError(err instanceof Error ? err.message : 'Could not clear notifications.');
    } finally {
      setNotificationAction(null);
    }
  }

  return (
    <section className="px-6 py-10 sm:px-10 lg:px-14 lg:py-14">
      <div className="mx-auto max-w-6xl">
        <div>
          <div className="mb-4 h-1 w-12 rounded-full bg-accent" />
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-brand">Your Tenjin dashboard</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Your study groups</h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
            Pick up where you left off and stay connected with your study partners.
          </p>
        </div>

        <div className="mt-8 grid gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-12">
        <div>
          {loading && <p className="text-slate-600">Loading your groups...</p>}
          {error && <p className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700" role="alert">{error}</p>}
          {!loading && !error && groups.length === 0 && (
            <p className="mt-6 text-sm text-slate-500">You haven't joined any groups yet.</p>
          )}

          {!loading && groups.length > 0 && (
            <ul className="grid gap-4 sm:grid-cols-2">
              {groups.map((group) => {
                const chatUrl = getSafeChatUrl(group.chat_url);
                const content = (
                  <>
                    <GroupIcon meetingMode={group.meeting_mode} />
                    <div className="min-w-0">
                      <h2 className="truncate text-lg font-semibold text-slate-900">{group.name}</h2>
                      {group.course_code && <p className="mt-1 text-sm text-slate-500">{group.course_code}</p>}
                    </div>
                  </>
                );

                return (
                  <li key={group.id}>
                    <div className="flex min-w-0 items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-brand hover:shadow-md">
                      {chatUrl ? (
                        <a
                          href={chatUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          aria-label={`Open chat for ${group.name}`}
                          className="flex min-w-0 flex-1 items-center gap-4 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                        >
                          {content}
                        </a>
                      ) : (
                        <div className="flex min-w-0 flex-1 items-center gap-4">
                          {content}
                        </div>
                      )}
                      {group.is_owner && (
                        <div className="flex shrink-0 flex-col gap-1.5">
                          <button
                            type="button"
                            onClick={() => void handleOpenMembers(group)}
                            aria-label={`Manage members of ${group.name}`}
                            className="rounded-lg bg-brand/10 px-2.5 py-1.5 text-xs font-semibold text-brand transition hover:bg-brand/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                          >
                            Members
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setLeaveGroupError('');
                              setGroupToLeave(group);
                            }}
                            aria-label={`Leave ${group.name}`}
                            className="rounded-lg bg-accent px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-accent/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                          >
                            Leave group
                          </button>
                        </div>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="space-y-6">
        <aside aria-labelledby="notifications-heading" className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <h2 id="notifications-heading" className="text-lg font-semibold text-slate-900">Notifications</h2>
            <div className="flex items-center gap-2">
              {hasNewNotifications && (
                <span className="rounded-full bg-accent/10 px-2.5 py-1 text-xs font-semibold text-accent">
                  {notifications.filter((notification) => notification.read_at === null).length} new
                </span>
              )}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => void handleClearNotifications()}
                  disabled={notificationAction !== null}
                  className="text-xs font-medium text-slate-500 underline-offset-2 hover:text-red-700 hover:underline disabled:opacity-50"
                >
                  {notificationAction === 'clear' ? 'Clearing...' : 'Clear all'}
                </button>
              )}
            </div>
          </div>

          {loading ? (
            <p className="mt-4 text-sm text-slate-500">Loading notifications...</p>
          ) : !hasNewNotifications ? (
            <p className="mt-4 text-sm text-slate-500">No new notifications.</p>
          ) : null}

          {notifications.length > 0 && (
            <ul className="mt-4 divide-y divide-slate-100">
              {notifications.map((notification) => (
                <li key={notification.id} className={`py-4 first:pt-0 last:pb-0 ${notification.read_at ? 'opacity-70' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm leading-6 text-slate-800">{getNotificationMessage(notification)}</p>
                      <time dateTime={notification.created_at} className="mt-1 block text-xs text-slate-400">
                        {formatNotificationDate(notification.created_at)}
                      </time>
                    </div>
                    {notification.read_at ? (
                      <span className="shrink-0 rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
                        Read
                      </span>
                    ) : (
                      <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand" aria-label="Unread" />
                    )}
                  </div>
                  <div className="mt-2 flex gap-4">
                    {!notification.read_at && (
                      <button
                        type="button"
                        onClick={() => void handleMarkNotificationRead(notification)}
                        disabled={notificationAction !== null}
                        className="text-xs font-medium text-brand hover:underline disabled:opacity-50"
                      >
                        {notificationAction === `read-${notification.id}` ? 'Marking...' : 'Mark as read'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleDeleteNotification(notification.id)}
                      disabled={notificationAction !== null}
                      className="text-xs font-medium text-slate-500 hover:text-red-700 hover:underline disabled:opacity-50"
                    >
                      {notificationAction === `delete-${notification.id}` ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {notificationError && <p className="mt-4 text-sm text-red-700" role="alert">{notificationError}</p>}
        </aside>
        <aside aria-labelledby="group-inbox-heading" className="h-fit rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 id="group-inbox-heading" className="text-lg font-semibold text-slate-900">Group inbox</h2>
              {joinRequests.length > 0 && (
                <span className="rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">
                  {joinRequests.length} pending
                </span>
              )}
            </div>
            {loading ? (
              <p className="mt-4 text-sm text-slate-500">Loading requests...</p>
            ) : joinRequests.length === 0 ? (
              <p className="mt-4 text-sm text-slate-500">There are no current requests.</p>
            ) : (
              <ul className="mt-4 divide-y divide-slate-100">
                {joinRequests.map((request) => (
                <li key={request.id} className="py-4 first:pt-0 last:pb-0">
                  <p className="text-sm leading-6 text-slate-800">
                    <span className="font-semibold">{request.requester_name || 'A student'}</span>
                    {' '}requested to join <span className="font-semibold">{request.group_name}</span>.
                  </p>
                  {request.message && <p className="mt-2 text-sm text-slate-600">{request.message}</p>}
                  <time dateTime={request.created_at} className="mt-1 block text-xs text-slate-400">
                    {formatNotificationDate(request.created_at)}
                  </time>
                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRequestDecision(request, 'accepted')}
                      disabled={requestActionId !== null}
                      className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {requestActionId === request.id ? 'Updating...' : 'Accept'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleRequestDecision(request, 'declined')}
                      disabled={requestActionId !== null}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Decline
                    </button>
                  </div>
                </li>
                ))}
              </ul>
            )}
            {requestError && <p className="mt-4 text-sm text-red-700" role="alert">{requestError}</p>}
        </aside>
        </div>
        </div>
        <Modal
          open={managingGroup !== null}
          onClose={handleCloseMembers}
          title={`Members of ${managingGroup?.name ?? 'group'}`}
        >
          {memberToRemove ? (
            <>
              <p className="text-sm text-slate-600">
                Remove {memberToRemove.display_name || 'this member'} from {managingGroup?.name}?
              </p>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setMemberToRemove(null)}
                  disabled={removingMemberId !== null}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void handleRemoveMember()}
                  disabled={removingMemberId !== null}
                  className="rounded-lg bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-50"
                >
                  {removingMemberId === memberToRemove.id ? 'Removing...' : 'Remove member'}
                </button>
              </div>
            </>
          ) : membersLoading ? (
            <p className="text-sm text-slate-600">Loading members...</p>
          ) : membersError ? null : groupMembers.length === 0 ? (
            <p className="text-sm text-slate-600">There are no members in this group.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {groupMembers.map((member) => (
                <li key={member.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <span className="text-sm font-medium text-slate-800">
                    {member.display_name || 'Name not set'}
                    {member.role === 'owner' && (
                      <span className="ml-2 text-xs font-normal text-slate-500">Owner</span>
                    )}
                  </span>
                  {member.role === 'member' && (
                    <button
                      type="button"
                      onClick={() => setMemberToRemove(member)}
                      className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
          {membersError && <p className="mt-4 text-sm text-red-700" role="alert">{membersError}</p>}
        </Modal>
        <Modal
          open={groupToLeave !== null}
          onClose={() => setGroupToLeave(null)}
          title="Delete your group?"
        >
          <p className="text-sm leading-6 text-slate-600">
            Leaving {groupToLeave?.name} as its owner will permanently delete the group, remove its members, and cancel pending requests. This cannot be undone.
          </p>
          {leaveGroupError && <p className="mt-4 text-sm text-red-700" role="alert">{leaveGroupError}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setGroupToLeave(null)}
              disabled={leavingGroupId !== null}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleLeaveGroup()}
              disabled={leavingGroupId !== null}
              className="rounded-lg bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-50"
            >
              {leavingGroupId === groupToLeave?.id ? 'Deleting...' : 'Delete group'}
            </button>
          </div>
        </Modal>
      </div>
    </section>
  );
}
// Gets any notification message based on the type of notification. If the actor or group name is missing, it will use a default value.
function getNotificationMessage(notification: DashboardNotification): string {
  const actor = notification.actor_name || 'Someone';
  const group = notification.group_name || 'a group';

  switch (notification.type) {
    case 'joined':
      return `${actor} joined ${group}.`;
    case 'left':
      return `${actor} left ${group}.`;
    case 'kicked':
      return `You were removed from ${group}.`;
    case 'request_accepted':
      return `Your request to join ${group} was accepted.`;
    case 'request_declined':
      return `Your request to join ${group} was declined.`;
    case 'new_request':
      return `${actor} requested to join ${group}.`;
  }
}
// Formats a date string into a more readable format, e.g. "Jan 1, 2023, 12:00 PM"
function formatNotificationDate(date: string): string {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(date));
}
// Validates a chat URL to ensure it is a valid HTTP or HTTPS URL. Returns the URL if valid, otherwise returns null.
function getSafeChatUrl(chatUrl: string | null): string | null {
  if (!chatUrl) return null;

  try {
    const url = new URL(chatUrl);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : null;
  } catch {
    return null;
  }
}
// Renders an icon representing the meeting mode of a group. The icon is a circle with a different symbol inside depending on the meeting mode.
function GroupIcon({ meetingMode }: { meetingMode: DashboardGroup['meeting_mode'] }) {
  const label = meetingMode === 'online'
    ? 'Online group'
    : meetingMode === 'in_person'
      ? 'In-person group'
      : 'Hybrid group';

  return (
    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-accent/10 text-accent" aria-label={label} title={label}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6" aria-hidden="true">
        {meetingMode === 'online' ? (
          <>
            <rect x="3" y="4" width="18" height="13" rx="2" />
            <path d="M8 21h8m-4-4v4" />
          </>
        ) : meetingMode === 'in_person' ? (
          <>
            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
          </>
        ) : (
          <>
            <circle cx="9" cy="8" r="3" />
            <circle cx="17" cy="9" r="2.5" />
            <path d="M3 20v-1a6 6 0 0 1 12 0v1m0-4a5 5 0 0 1 6 4" />
          </>
        )}
      </svg>
    </span>
  );
}