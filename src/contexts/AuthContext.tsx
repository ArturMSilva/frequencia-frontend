import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

interface AuthUser {
  token: string;
  role: 'TEACHER' | 'STUDENT';
  name: string;
}

interface AuthContextType {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem('auth');
    if (stored) setUserState(JSON.parse(stored));
  }, []);

  function setUser(u: AuthUser | null) {
    setUserState(u);
    if (u) {
      localStorage.setItem('auth', JSON.stringify(u));
      localStorage.setItem('token', u.token);
    } else {
      localStorage.removeItem('auth');
      localStorage.removeItem('token');
    }
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
