import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import MedicationsPage from './pages/MedicationsPage';
import AppointmentsPage from './pages/AppointmentsPage';
import VitalsPage from './pages/VitalsPage';
import EmergencyPage from './pages/EmergencyPage';
import CheckInsPage from './pages/CheckInsPage';
import MessagesPage from './pages/MessagesPage';
import DocumentsPage from './pages/DocumentsPage';
import ActivitiesPage from './pages/ActivitiesPage';
import RemindersPage from './pages/RemindersPage';
import BillingPage from './pages/BillingPage';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

const PublicRoute = ({ children }) => {
  const { user } = useAuth();
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
      
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="medications" element={<MedicationsPage />} />
        <Route path="appointments" element={<AppointmentsPage />} />
        <Route path="vitals" element={<VitalsPage />} />
        <Route path="emergency" element={<EmergencyPage />} />
        <Route path="checkins" element={<CheckInsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="documents" element={<DocumentsPage />} />
        <Route path="activities" element={<ActivitiesPage />} />
        <Route path="reminders" element={<RemindersPage />} />
        <Route path="billing" element={<BillingPage />} />
      </Route>
      
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
        <Toaster position="top-right" />
      </AuthProvider>
    </Router>
  );
}

export default App;