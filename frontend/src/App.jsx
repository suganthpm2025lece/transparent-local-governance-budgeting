import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import MainLayout from './layouts/MainLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/ProtectedRoute';

import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import PublicDashboardPage from './pages/PublicDashboardPage';
import RegisterPage from './pages/RegisterPage';
import LoginPage from './pages/LoginPage';
import CitizenDashboardPage from './pages/CitizenDashboardPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import BudgetAllocationPage from './pages/BudgetAllocationPage';
import DepartmentSpendingPage from './pages/DepartmentSpendingPage';
import ProposalSubmissionPage from './pages/ProposalSubmissionPage';
import ProposalListingPage from './pages/ProposalListingPage';
import VotingPage from './pages/VotingPage';
import ProjectTrackingPage from './pages/ProjectTrackingPage';
import ReportsAnalyticsPage from './pages/ReportsAnalyticsPage';
import FeedbackPage from './pages/FeedbackPage';
import ProfilePage from './pages/ProfilePage';
import AdminUsersPage from './pages/AdminUsersPage';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public & Citizen Routes */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/dashboard" element={<PublicDashboardPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/spending" element={<DepartmentSpendingPage />} />
              <Route path="/proposals" element={<ProposalListingPage />} />
              <Route path="/voting" element={<VotingPage />} />
              <Route path="/projects" element={<ProjectTrackingPage />} />
              <Route path="/reports" element={<ReportsAnalyticsPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />

              <Route
                path="/citizen"
                element={
                  <ProtectedRoute>
                    <CitizenDashboardPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/proposals/new"
                element={
                  <ProtectedRoute>
                    <ProposalSubmissionPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
            </Route>

            {/* Administrator Console Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute requireAdmin>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminDashboardPage />} />
              <Route path="budgets" element={<BudgetAllocationPage />} />
              <Route path="users" element={<AdminUsersPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
