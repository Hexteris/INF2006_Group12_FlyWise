import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { User, LoginRequest, SignupRequest, UpdateProfileRequest } from '../../types';
import {
  authLogin,
  authSignup,
  authMe,
  authUpdateProfile,
  authDeleteAccount,
} from '../services/api';

const TOKEN_STORAGE_KEY = 'flywise_auth_token';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'signup';
  isSettingsModalOpen: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (userData: SignupRequest) => Promise<void>;
  logout: () => void;
  updateProfile: (updates: UpdateProfileRequest) => Promise<void>;
  deleteAccount: () => Promise<void>;
  openAuthModal: (mode?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  openSettingsModal: () => void;
  closeSettingsModal: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    loading: true, // Start with loading true while we check localStorage
    error: null,
    isAuthModalOpen: false,
    authModalMode: 'login',
    isSettingsModalOpen: false,
  });

  // Load token from localStorage on initial mount and validate it
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    
    if (!storedToken) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    // Try to validate the token by fetching user data
    const validateToken = async () => {
      try {
        const user = await authMe(storedToken);
        setState(prev => ({
          ...prev,
          user,
          token: storedToken,
          isAuthenticated: true,
          loading: false,
        }));
      } catch (error) {
        // Token is invalid or expired
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setState(prev => ({
          ...prev,
          user: null,
          token: null,
          isAuthenticated: false,
          loading: false,
        }));
      }
    };

    validateToken();
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { token, user } = await authLogin(credentials);
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      setState(prev => ({
        ...prev,
        user,
        token,
        isAuthenticated: true,
        loading: false,
        isAuthModalOpen: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Login failed',
      }));
      throw error;
    }
  }, []);

  const signup = useCallback(async (userData: SignupRequest) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { token, user } = await authSignup(userData);
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
      setState(prev => ({
        ...prev,
        user,
        token,
        isAuthenticated: true,
        loading: false,
        isAuthModalOpen: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Signup failed',
      }));
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,
      isAuthModalOpen: false,
      authModalMode: 'login',
      isSettingsModalOpen: false,
    });
  }, []);

  const updateProfile = useCallback(async (updates: UpdateProfileRequest) => {
    if (!state.token) {
      throw new Error('Not authenticated');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const user = await authUpdateProfile(state.token, updates);
      setState(prev => ({
        ...prev,
        user,
        loading: false,
        isSettingsModalOpen: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Profile update failed',
      }));
      throw error;
    }
  }, [state.token]);

  const deleteAccount = useCallback(async () => {
    if (!state.token) {
      throw new Error('Not authenticated');
    }

    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      await authDeleteAccount(state.token);
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setState({
        user: null,
        token: null,
        isAuthenticated: false,
        loading: false,
        error: null,
        isAuthModalOpen: false,
        authModalMode: 'login',
        isSettingsModalOpen: false,
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Account deletion failed',
      }));
      throw error;
    }
  }, [state.token]);

  const openAuthModal = useCallback((mode: 'login' | 'signup' = 'login') => {
    setState(prev => ({
      ...prev,
      isAuthModalOpen: true,
      authModalMode: mode,
      error: null,
    }));
  }, []);

  const closeAuthModal = useCallback(() => {
    setState(prev => ({ ...prev, isAuthModalOpen: false, error: null }));
  }, []);

  const openSettingsModal = useCallback(() => {
    setState(prev => ({ ...prev, isSettingsModalOpen: true, error: null }));
  }, []);

  const closeSettingsModal = useCallback(() => {
    setState(prev => ({ ...prev, isSettingsModalOpen: false, error: null }));
  }, []);

  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  const contextValue: AuthContextType = {
    ...state,
    login,
    signup,
    logout,
    updateProfile,
    deleteAccount,
    openAuthModal,
    closeAuthModal,
    openSettingsModal,
    closeSettingsModal,
    clearError,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};