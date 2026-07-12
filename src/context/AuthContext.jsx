import { createContext, useState, useEffect, useCallback } from 'react';
import { loginUser } from '../api/user/login';
import { registerUser } from '../api/user/register';
import { logoutUser } from '../api/user/logout';
import { getMeUser } from '../api/user/me';
import { parseAuthResult, parseMeUser } from '../api/authHelpers';
import {
  ACCESS_TOKEN_KEY,
  REFRESH_TOKEN_KEY,
  USER_KEY,
  USER_UNAUTHORIZED_EVENT,
} from '../constants/userAuth';
import { getApiErrorMessage } from '../utils/adminAuth';

export const AuthContext = createContext();

function persistSession({ user, accessToken, refreshToken }) {
  if (accessToken) localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(ACCESS_TOKEN_KEY));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem(USER_KEY);
    try {
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }, []);

  useEffect(() => {
    const onUnauthorized = () => clearSession();
    window.addEventListener(USER_UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(USER_UNAUTHORIZED_EVENT, onUnauthorized);
  }, [clearSession]);

  useEffect(() => {
    const verifySession = async () => {
      if (token) {
        try {
          const response = await getMeUser();
          const me = parseMeUser(response);
          if (response.success && me) {
            setUser(me);
            localStorage.setItem(USER_KEY, JSON.stringify(me));
          }
        } catch (error) {
          if (error.response?.status === 401) {
            clearSession();
          } else {
            console.warn('Could not verify session with server, keeping local state.');
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
    persistSession(session);
  }, []);

  const login = async (credentials) => {
    try {
      const response = await loginUser(credentials);
      const session = parseAuthResult(response);
      if (response.success && session) {
        applySession(session);
        return { success: true };
      }
      return { success: false, message: 'Login failed. Invalid server response.' };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, 'Login failed. Please check your credentials.'),
      };
    }
  };

  const register = async (userData) => {
    try {
      const response = await registerUser(userData);
      const session = parseAuthResult(response);
      if (response.success && session) {
        applySession(session);
        return { success: true };
      }
      return { success: false, message: 'Registration failed. Invalid server response.' };
    } catch (error) {
      return {
        success: false,
        message: getApiErrorMessage(error, 'Registration failed.'),
      };
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    try {
      if (token && refreshToken) {
        await logoutUser(refreshToken);
      }
    } catch {
      console.error('Logout API failed, cleaning up locally.');
    } finally {
      clearSession();
    }
  };

  const refreshUser = async () => {
    try {
      const response = await getMeUser();
      const me = parseMeUser(response);
      if (response.success && me) {
        setUser(me);
        localStorage.setItem(USER_KEY, JSON.stringify(me));
      }
    } catch {
      console.error('Refresh failed.');
    }
  };

  return (
    <AuthContext.Provider value={{ token, user, login, register, logout, refreshUser, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
