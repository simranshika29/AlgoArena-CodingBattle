import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import Layout from './components/Layout';
import RequireAuth from './components/RequireAuth';
import { LoadingState } from './components/StatusViews';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Landing from './pages/Landing';
import { Login, Register } from './pages/AuthPages';
import NotFound from './pages/NotFound';
import theme from './theme';

// Route-level code splitting keeps Monaco and heavier pages out of the initial bundle.
const Problems = lazy(() => import('./pages/Problems'));
const ProblemDetail = lazy(() => import('./pages/ProblemDetail'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Profile = lazy(() => import('./pages/Profile'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const Arena = lazy(() => import('./pages/Arena'));
const DuelRoom = lazy(() => import('./pages/DuelRoom'));
const Contribute = lazy(() => import('./pages/Contribute'));
const AdminReview = lazy(() => import('./pages/AdminReview'));

const MyProfileRedirect: React.FC = () => {
  const { user } = useAuth();
  return <Navigate to={user ? `/u/${user.username}` : '/login'} replace />;
};

const App: React.FC = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingState minHeight="60vh" />}>
            <Routes>
              <Route element={<Layout />}>
                <Route index element={<Landing />} />
                <Route path="login" element={<Login />} />
                <Route path="register" element={<Register />} />
                <Route path="problems" element={<Problems />} />
                <Route path="problems/:id" element={<ProblemDetail />} />
                <Route path="leaderboard" element={<Leaderboard />} />
                <Route path="u/:username" element={<Profile />} />

                <Route path="dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                <Route path="profile" element={<RequireAuth><MyProfileRedirect /></RequireAuth>} />
                <Route path="arena" element={<RequireAuth><Arena /></RequireAuth>} />
                <Route path="arena/:code" element={<RequireAuth><DuelRoom /></RequireAuth>} />
                <Route path="contribute" element={<RequireAuth><Contribute /></RequireAuth>} />
                <Route path="admin/review" element={<RequireAuth admin><AdminReview /></RequireAuth>} />

                {/* Old paths kept working */}
                <Route path="portfolio" element={<Navigate to="/profile" replace />} />
                <Route path="duel-lobby" element={<Navigate to="/arena" replace />} />
                <Route path="submit-problem" element={<Navigate to="/contribute" replace />} />

                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  </ThemeProvider>
);

export default App;
