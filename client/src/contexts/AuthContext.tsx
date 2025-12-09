import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { http } from '../api/http';

interface Organization {
  id: string;
  name: string;
  email: string;
  mission: string | null;
  createdAt: string;
}

interface AuthContextType {
  organization: Organization | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string, mission?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored token on mount
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      // Verify token and get organization
      http
        .get<{ organization: Organization }>('/auth/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
        .then(({ data }) => {
          setOrganization(data.organization);
        })
        .catch(() => {
          // Token invalid, clear it
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await http.post<{ organization: Organization; token: string }>('/auth/login', {
      email,
      password,
    });
    setToken(data.token);
    setOrganization(data.organization);
    localStorage.setItem('token', data.token);
  };

  const signup = async (name: string, email: string, password: string, mission?: string) => {
    const { data } = await http.post<{ organization: Organization; token: string }>('/auth/signup', {
      name,
      email,
      password,
      mission,
    });
    setToken(data.token);
    setOrganization(data.organization);
    localStorage.setItem('token', data.token);
  };

  const logout = () => {
    setToken(null);
    setOrganization(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ organization, token, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

