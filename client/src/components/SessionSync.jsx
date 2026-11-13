import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const SessionSync = () => {
  const location = useLocation();
  const { token, user, updateUser, logout } = useAuth();

  useEffect(() => {
    if (!token) return;

    const syncProfile = async () => {
      try {
        const { data } = await api.get('/user/profile');
        if (data.success && data.user) {
          // Compare with current user state to avoid unnecessary re-renders
          const isChanged = !user || 
            user.role !== data.user.role || 
            user.email !== data.user.email || 
            user.name !== data.user.name ||
            user.shopName !== data.user.shopName ||
            user.paymentStatus !== data.user.paymentStatus ||
            user.paymentTxnId !== data.user.paymentTxnId;

          if (isChanged) {
            console.log('Session sync: Updating user data in frontend. Role:', data.user.role);
            updateUser(data.user);
          }
        }
      } catch (err) {
        console.error('Session sync failed:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          logout();
        }
      }
    };

    // Sync on location change or initial load
    syncProfile();

    // Sync periodically every 10 seconds to detect admin privilege changes in real-time
    const interval = setInterval(syncProfile, 10000);

    return () => clearInterval(interval);
  }, [location.pathname, token, user, updateUser, logout]);

  return null;
};

export default SessionSync;
