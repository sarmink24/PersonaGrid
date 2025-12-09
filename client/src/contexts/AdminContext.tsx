import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { http } from '../api/http';

interface Admin {
  id: string;
  email: string;
  createdAt: string;
}

interface AdminContextType {
  admin: Admin | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export const AdminProvider = ({ children }: { children: ReactNode }) => {
  const [admin, setAdmin] = useState<Admin | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      setToken(storedToken);
      http
        .get<{ admin: Admin }>('/admin/me', {
          headers: { Authorization: `Bearer ${storedToken}` },
        })
        .then(({ data }) => {
          setAdmin(data.admin);
        })
        .catch(() => {
          localStorage.removeItem('adminToken');
          setToken(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await http.post<{ admin: Admin; token: string }>('/admin/login', {
      email,
      password,
    });
    setToken(data.token);
    setAdmin(data.admin);
    localStorage.setItem('adminToken', data.token);
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem('adminToken');
  };

  return (
    <AdminContext.Provider value={{ admin, token, login, logout, isLoading }}>
      {children}
    </AdminContext.Provider>
  );
};

export const useAdmin = () => {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
};

