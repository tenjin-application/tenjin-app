import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from '@/features/auth/LoginPage';
import OnboardingPage from '@/features/auth/OnboardingPage';
import DashboardPage from '@/features/dashboard/DashboardPage';
import GroupsPage from '@/features/groups/GroupsPage';
import { AppLayout } from '@/components/layouts/AppLayout';
import { SettingsLayout } from '@/components/layouts/SettingsLayout';
import AccessibilityPage from '@/features/settings/AccessibilityPage';
import GeneralPage from '@/features/settings/GeneralPage';
import NotificationsPage from '@/features/settings/NotificationsPage';
import ProfilePage from '@/features/settings/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/groups" element={<GroupsPage />} />
        </Route>
        <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="profile" replace />} />
            <Route path="accessibility" element={<AccessibilityPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="general" element={<GeneralPage />} />
          </Route>
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}