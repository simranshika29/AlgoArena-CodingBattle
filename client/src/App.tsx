import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Navigation from './components/Navigation';
import Login from './components/Login';
import Register from './components/Register';
import ProblemList from './components/ProblemList';
import ProblemDetail from './components/ProblemDetail';
import SubmitProblem from './components/SubmitProblem';
import AdminReview from './components/AdminReview';
import DuelRoom from './components/DuelRoom';
import DuelLobby from './components/DuelLobby';
import Portfolio from './components/Portfolio';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9'
    },
    secondary: {
      main: '#f48fb1'
    }
  }
});

const PrivateRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Navigation />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/problems"
              element={
                <PrivateRoute>
                  <ProblemList />
                </PrivateRoute>
              }
            />
            <Route
              path="/problems/:id"
              element={
                <PrivateRoute>
                  <ProblemDetail />
                </PrivateRoute>
              }
            />
            <Route
              path="/submit-problem"
              element={
                <PrivateRoute>
                  <SubmitProblem />
                </PrivateRoute>
              }
            />
            <Route
              path="/admin/review"
              element={
                <PrivateRoute>
                  <AdminReview />
                </PrivateRoute>
              }
            />
            <Route
              path="/duel"
              element={
                <PrivateRoute>
                  <DuelRoom />
                </PrivateRoute>
              }
            />
            <Route
              path="/duel-lobby"
              element={
                <PrivateRoute>
                  <DuelLobby />
                </PrivateRoute>
              }
            />
            <Route path="/portfolio" element={<Portfolio />} />
            <Route path="/" element={<Navigate to="/problems" />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
