
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import StudentsPage from './pages/students/StudentsPage';
import StudentDetailPage from './pages/students/StudentDetailPage';
import TeachersPage from './pages/teachers/TeachersPage';
import ClassesPage from './pages/classes/ClassesPage';
import FeesPage from './pages/fees/FeesPage';
import GradesPage from './pages/grades/GradesPage';
import CommunicationPage from './pages/communication/CommunicationPage';
import ReportsPage from './pages/reports/ReportsPage';
import SettingsPage from './pages/settings/SettingsPage';
import LoadingSpinner from './components/ui/LoadingSpinner';

function App() {
  const { loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        
        {/* Student Management */}
        <Route path="students" element={<StudentsPage />} />
        <Route path="students/:studentId" element={<StudentDetailPage />} />
        
        {/* Teacher Management */}
        <Route
          path="teachers"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin']}>
              <TeachersPage />
            </ProtectedRoute>
          }
        />

        {/* Class Management */}
        <Route path="classes" element={<ClassesPage />} />

        {/* Fee Management */}
        <Route
          path="fees"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}>
              <FeesPage />
            </ProtectedRoute>
          }
        />
        
        {/* Grades */}
        <Route path="grades" element={<GradesPage />} />
        
        {/* Communication */}
        <Route path="communication" element={<CommunicationPage />} />

        {/* Reports */}
        <Route
          path="reports"
          element={
            <ProtectedRoute allowedRoles={['super_admin', 'admin', 'teacher']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route path="settings" element={<SettingsPage />} />
      </Route>
      
      {/* Catch all route */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
