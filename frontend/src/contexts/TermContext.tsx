import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Term } from '../types';
import { academicService } from '../services/academicService';
import { useAuth } from './AuthContext';
import { useToast } from '../hooks/useToast';

interface TermContextType {
  currentTerm: Term | null;
  allTerms: Term[];
  loading: boolean;
  error: string | null;
  setCurrentTerm: (termId: string) => Promise<void>;
  refreshTerms: () => Promise<void>;
  refreshCurrentTerm: () => Promise<void>;
}

const TermContext = createContext<TermContextType | undefined>(undefined);

export const useTermContext = () => {
  const context = useContext(TermContext);
  if (context === undefined) {
    throw new Error('useTermContext must be used within a TermProvider');
  }
  return context;
};

interface TermProviderProps {
  children: ReactNode;
}

export const TermProvider: React.FC<TermProviderProps> = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [currentTerm, setCurrentTermState] = useState<Term | null>(null);
  const [allTerms, setAllTerms] = useState<Term[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  // Load current term from localStorage on mount
  useEffect(() => {
    const savedCurrentTerm = localStorage.getItem('currentTerm');
    if (savedCurrentTerm) {
      try {
        const term = JSON.parse(savedCurrentTerm);
        setCurrentTermState(term);
      } catch (error) {
        console.error('Error parsing saved current term:', error);
        localStorage.removeItem('currentTerm');
      }
    }
  }, []);

  // Save current term to localStorage whenever it changes
  useEffect(() => {
    if (currentTerm) {
      localStorage.setItem('currentTerm', JSON.stringify(currentTerm));
    } else {
      localStorage.removeItem('currentTerm');
    }
  }, [currentTerm]);

  const refreshCurrentTerm = async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Skip term loading for platform admins
    if (user.role === 'platform_super_admin') {
      return;
    }

    // Skip for students
    if (user.role === 'student') {
      return;
    }

    try {
      setError(null);
      const term = await academicService.getCurrentTerm();
      setCurrentTermState(term);
    } catch (error: any) {
      console.error('Error fetching current term:', error);
      if (error.response?.status === 404) {
        // No current term set
        setCurrentTermState(null);
        setError('No current term is set. Please set a current term in settings.');
      } else {
        setError('Failed to load current term');
      }
    }
  };

  const refreshTerms = async () => {
    if (!isAuthenticated || !user) {
      return;
    }

    // Skip term loading for platform admins
    if (user.role === 'platform_super_admin') {
      return;
    }

    // Skip for students
    if (user.role === 'student') {
      return;
    }

    try {
      setError(null);
      const terms = await academicService.getTerms();
      setAllTerms(terms);
    } catch (error: any) {
      console.error('Error fetching terms:', error);
      setError('Failed to load terms');
    }
  };

  const setCurrentTerm = async (termId: string) => {
    try {
      setLoading(true);
      setError(null);

      // Prevent students from setting current term
      if (user?.role === 'student') {
        throw new Error('Students cannot set current term');
      }

      // Call API to set current term
      await academicService.setCurrentTerm(termId);

      // Refresh current term and all terms
      await Promise.all([refreshCurrentTerm(), refreshTerms()]);

      toast.showSuccess('Current term updated successfully');
    } catch (error: any) {
      console.error('Error setting current term:', error);
      const errorMessage = error.response?.data?.detail || 'Failed to set current term';
      setError(errorMessage);
      toast.showError(errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Initial data load - only when user is authenticated and not a platform admin
  useEffect(() => {
    const loadInitialData = async () => {
      if (!isAuthenticated || !user) {
        setLoading(false);
        return;
      }

      // Skip term loading for platform admins
      if (user.role === 'platform_super_admin') {
        setLoading(false);
        return;
      }

      // Skip loading entirely for students
      if (user.role === 'student') {
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        // Load both current term and all terms in parallel
        await Promise.all([refreshCurrentTerm(), refreshTerms()]);
      } catch (error) {
        console.error('Error loading initial term data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [isAuthenticated, user]);

  const value: TermContextType = {
    currentTerm,
    allTerms,
    loading,
    error,
    setCurrentTerm,
    refreshTerms,
    refreshCurrentTerm,
  };

  return <TermContext.Provider value={value}>{children}</TermContext.Provider>;
};

export default TermContext;
