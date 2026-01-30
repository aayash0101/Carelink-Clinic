// src/context/AuthContext.jsx
import { createContext, useState, useContext, useEffect } from 'react';
import api from '../services/api';
import { toast } from 'react-toastify';
import { AUTH_ME, AUTH_LOGIN, AUTH_LOGOUT, AUTH_REGISTER } from '../services/endpoints';

const AuthContext = createContext(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data } = await api.get(AUTH_ME);
      if (data.success) setUser(data.data.user);
      else setUser(null);
    } catch (error) {
      // 401 (not logged in) or any error: user not authenticated (expected on first load)
      // Silently handle, do not log to console
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password, totpCode = null, recaptchaToken = null) => {
    try {
      const { data } = await api.post(AUTH_LOGIN, { email, password, totpCode, recaptchaToken });

      if (data.requires2FA) {
        return { success: false, requires2FA: true };
      }

      if (data.success) {
        setUser(data.data.user);
        toast.success('Login successful!');
        return { success: true };
      }

      return { success: false };
    } catch (error) {
      const err = error.response?.data;
      if (err?.requiresRecaptcha) return { success: false, requiresRecaptcha: true };
      toast.error(err?.message || 'Login failed');
      return { success: false, error: err };
    }
  };

  const register = async (payload) => {
    try {
      const { data } = await api.post(AUTH_REGISTER, payload);
      if (data.success) {
        toast.success('Registration successful! Please verify your email.', { autoClose: 8000 });
        return { success: true };
      }
      return { success: false };
    } catch (error) {
      const err = error.response?.data;
      toast.error(err?.message || 'Registration failed');
      return { success: false, errors: err?.errors };
    }
  };

  const logout = async () => {
    try {
      await api.post(AUTH_LOGOUT);
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      toast.info('Logged out');
      window.location.href = '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        isAuthenticated: !!user,
        checkAuthStatus
      }}
    >
      {loading ? (
        <div style={{ height: '100vh', display: 'grid', placeItems: 'center' }}>Loading...</div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};
