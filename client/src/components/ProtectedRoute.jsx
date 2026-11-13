import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from './LoadingSpinner';

const ProtectedRoute = ({ children }) => {
  const { user, isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isApproved = user?.paymentStatus === 'approved' || user?.role === 'admin';

  // Redirect unapproved users to /payment unless they are already on /payment
  if (!isApproved) {
    if (location.pathname !== '/payment') {
      return <Navigate to="/payment" replace />;
    }
  } else {
    // If they are approved (or admin), they shouldn't be visiting /payment
    if (location.pathname === '/payment') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
