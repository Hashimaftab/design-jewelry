import { createContext, useState, useEffect, useCallback } from 'react';
import { loginAdmin } from '../api/admin/login';
import { logoutAdmin } from '../api/admin/logout';
import { getMeAdmin } from '../api/admin/me';
import { parseAuthResult, parseMeUser } from '../api/authHelpers';
import {
  ADMIN_TOKEN_KEY,
  ADMIN_REFRESH_TOKEN_KEY,
  ADMIN_USER_KEY,
  ADMIN_UNAUTHORIZED_EVENT,
} from '../constants/adminAuth';
import { isAdminRole, getApiErrorMessage } from '../utils/adminAuth';

export const AdminAuthContext = createContext();

export const AdminAuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(ADMIN_TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(ADMIN_USER_KEY);
    try {
      const parsed = saved ? JSON.parse(saved) : null;
      return isAdminRole(parsed) ? parsed : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const clearAdminSession = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
    localStorage.removeItem(ADMIN_REFRESH_TOKEN_KEY);
    localStorage.removeItem(ADMIN_USER_KEY);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => clearAdminSession();
    window.addEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(ADMIN_UNAUTHORIZED_EVENT, onUnauthorized);
  }, [clearAdminSession]);

  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const response = await getMeAdmin();
          const me = parseMeUser(response);
          if (response.success && me && isAdminRole(me)) {
            setUser(me);
            localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(me));
          } else {
            clearAdminSession();
          }
        } catch (error) {
          if (error.response?.status === 401) {
            clearAdminSession();
          } else {
            const saved = localStorage.getItem(ADMIN_USER_KEY);
            try {
              const parsed = saved ? JSON.parse(saved) : null;
              if (!isAdminRole(parsed)) clearAdminSession();
            } catch {
              clearAdminSession();
            }
          }
        }
      }
      setLoading(false);
    };

    verifySession();
  }, []);

  const applySession = useCallback((session) => {
    setToken(session.accessToken);
    setUser(session.user);
    localStorage.setItem(ADMIN_TOKEN_KEY, session.accessToken);
    localStorage.setItem(ADMIN_REFRESH_TOKEN_KEY, session.refreshToken);
    localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(session.user));
  }, []);

  const login = async (credentials) => {
    try {
      const response = await loginAdmin(credentials);
      const session = parseAuthResult(response);
      if (response.success && session) {
        if (!isAdminRole(session.user)) {
          return {
            success: false,
            message: 'Access denied. This portal is restricted to administrators.',
          };
        }
        applySession(session);
        return { success: true };
      }
      return {
        success: false,
        message: response.message || 'Sign-in failed.',
      };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, 'Sign-in failed. Please check your credentials.'),
      };
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(ADMIN_REFRESH_TOKEN_KEY);
    try {
      if (token && refreshToken) {
        await logoutAdmin(refreshToken);
      }
    } catch {
      // still clear locally
    } finally {
      clearAdminSession();
    }
  };

  const refreshAdmin = async () => {
    try {
      const response = await getMeAdmin();
      const me = parseMeUser(response);
      if (response.success && me && isAdminRole(me)) {
        setUser(me);
        localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(me));
      }
    } catch {
      // ignore
    }
  };

  return (
    <AdminAuthContext.Provider
      value={{ token, user, login, logout, refreshAdmin, loading, isAdmin: isAdminRole(user) }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};
