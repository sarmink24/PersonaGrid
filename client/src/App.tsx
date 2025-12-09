import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './contexts/AuthContext';
import { useAdmin } from './contexts/AdminContext';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { AdminCommandPreviewPage } from './pages/AdminCommandPreviewPage';
import { SmartCommandPreviewPage } from './pages/SmartCommandPreviewPage';
import { PersonaProfilePage } from './pages/PersonaProfilePage';
import { OrganizationProfilePage } from './pages/OrganizationProfilePage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

function App() {
  const { organization, isLoading: orgLoading } = useAuth();
  const { admin, isLoading: adminLoading } = useAdmin();

  if (orgLoading || adminLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 20% 20%, #2b2b5a, #0f0f1d 60%)',
        color: '#f4f4ff'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Admin Routes */}
        <Route
          path="/admin/login"
          element={admin ? <Navigate to="/admin/dashboard" replace /> : <AdminLoginPage />}
        />
        <Route
          path="/admin/dashboard"
          element={admin ? <AdminDashboardPage /> : <Navigate to="/admin/login" replace />}
        />
        <Route
          path="/admin/command/preview"
          element={admin ? <AdminCommandPreviewPage /> : <Navigate to="/admin/login" replace />}
        />
        <Route
          path="/admin/personas/:id"
          element={admin ? <PersonaProfilePage isAdmin /> : <Navigate to="/admin/login" replace />}
        />
        <Route
          path="/admin/organizations/:id"
          element={admin ? <OrganizationProfilePage /> : <Navigate to="/admin/login" replace />}
        />

        {/* Organization Routes */}
        <Route
          path="/login"
          element={organization ? <Navigate to="/dashboard" replace /> : <LoginPage />}
        />
        <Route
          path="/forgot-password"
          element={<ForgotPasswordPage />}
        />
        <Route
          path="/reset-password"
          element={<ResetPasswordPage />}
        />
        <Route
          path="/dashboard"
          element={organization ? <DashboardPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/smart-command/preview"
          element={organization ? <SmartCommandPreviewPage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/personas/:id"
          element={organization ? <PersonaProfilePage /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/"
          element={
            admin ? <Navigate to="/admin/dashboard" replace /> :
              organization ? <Navigate to="/dashboard" replace /> :
                <Navigate to="/login" replace />
          }
        />
      </Routes>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#1a1a2e',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
          success: {
            iconTheme: {
              primary: '#646cff',
              secondary: '#fff',
            },
          },
          error: {
            iconTheme: {
              primary: '#ff5757',
              secondary: '#fff',
            },
          },
        }}
      />
    </>
  );
}

export default App;
