import { createContext, useContext, useState, useCallback } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => sessionStorage.getItem('token') || null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const clearError = useCallback(() => setError(null), []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/login', { email, password });
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const message = err.response?.data?.message || (err.message === 'Network Error' ? 'Connection error. Please try again.' : 'Invalid email or password.');
      setError(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (name, email, password, shopName) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/auth/register', { name, email, password, shopName });
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return { success: true };
    } catch (err) {
      const isAlreadyRegistered = err.response?.status === 400 && err.response?.data?.message?.toLowerCase().includes('already');
      const message = err.response?.data?.message || (isAlreadyRegistered ? 'Email already registered. Please sign in.' : 'Registration failed. Please try again.');
      setError(message);
      return { success: false, message, isAlreadyRegistered };
    } finally {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = useCallback(async (customEmail = null) => {
    setLoading(true);
    setError(null);
    try {
      // If a custom or fallback email is provided directly
      if (customEmail) {
        const { data } = await api.post('/auth/google', {
          email: customEmail,
          name: customEmail.split('@')[0],
        });
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }

      // 1. Try Google Identity Services (GIS)
      try {
        const { signInWithGoogleOAuth } = await import('../lib/googleAuth');
        const gisResult = await signInWithGoogleOAuth();
        const { data } = await api.post('/auth/google', {
          accessToken: gisResult.accessToken,
          email: gisResult.email,
          name: gisResult.name,
          photoURL: gisResult.photoURL,
        });
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } catch (gisErr) {
        console.warn('GIS attempt not completed, trying Firebase popup:', gisErr);
        // 2. Try Firebase Auth popup
        const { auth, googleAuthProvider, signInWithPopup } = await import('../lib/firebase');
        const fbResult = await signInWithPopup(auth, googleAuthProvider);
        const idToken = await fbResult.user.getIdToken();
        const { data } = await api.post('/auth/google', {
          idToken,
          email: fbResult.user.email,
          name: fbResult.user.displayName,
          photoURL: fbResult.user.photoURL,
        });
        sessionStorage.setItem('token', data.token);
        sessionStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      }
    } catch (err) {
      console.warn('Google popup restricted in current iframe sandbox:', err);
      // Do not set generic scary error banner on blocked popups; return clean fallback signal
      return {
        success: false,
        requiresFallback: true,
        message: 'Google popup was blocked by browser preview sandbox. Use the instant one-click button below.',
      };
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser) => {
    setUser(updatedUser);
    sessionStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  const isAuthenticated = !!token && !!user;

  return (
    <AuthContext.Provider
      value={{ user, token, loading, error, isAuthenticated, login, register, loginWithGoogle, logout, updateUser, clearError }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export default AuthContext;
