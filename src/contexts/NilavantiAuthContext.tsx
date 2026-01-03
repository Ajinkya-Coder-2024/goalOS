import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Cookies from 'js-cookie';

interface UserData {
  id: string;
  username: string;
  email: string;
  password: string;
  createdAt?: Date;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: UserData | null;
  login: (password: string) => Promise<boolean>;
  register: (userData: { username: string; email: string; password: string }) => Promise<boolean>;
  logout: () => void;
  error: string | null;
  loading: boolean;
  showRegisterForm: boolean;
  toggleRegisterForm: () => void;
}

const NilavantiAuthContext = createContext<AuthContextType | undefined>(undefined);

// JWT token name for cookies
const AUTH_TOKEN = 'nilavanti_token';
// Hardcoded password (for demo purposes only)
const NILAVANTI_PASSWORD = 'Nilavanti@123';

export const NilavantiAuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [user, setUser] = useState<UserData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true); // Start with loading true
  const [showRegisterForm, setShowRegisterForm] = useState<boolean>(false);
  const [registeredUsers, setRegisteredUsers] = useState<UserData[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  // Check for existing session on initial load
  useEffect(() => {
    const token = Cookies.get(AUTH_TOKEN);
    if (token) {
      // In a real app, you would verify the token with your backend
      setIsAuthenticated(true);
      // Try to get current user from registered users
      const users: UserData[] = JSON.parse(localStorage.getItem('nilavanti_users') || '[]');
      if (users.length > 0) {
        setUser(users[0]); // Set first user as current user
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (password: string) => {
    setLoading(true);
    setError(null);
    
    return new Promise<boolean>((resolve) => {
      setTimeout(async () => {
        try {
          // Check hardcoded password first (for backward compatibility)
          if (password === NILAVANTI_PASSWORD) {
            // Set a cookie that expires in 30 days
            Cookies.set(AUTH_TOKEN, 'dummy_token', { expires: 30 });
            setIsAuthenticated(true);
            const from = location.state?.from?.pathname || '/projects/nilavanti';
            navigate(from, { replace: true });
            resolve(true);
            return;
          }
          
          // Check registered users
          const users: UserData[] = JSON.parse(localStorage.getItem('nilavanti_users') || '[]');
          const loggedInUser = users.find(u => u.password === password);
          
          if (loggedInUser) {
            // Set a cookie that expires in 30 days
            Cookies.set(AUTH_TOKEN, 'dummy_token', { expires: 30 });
            setIsAuthenticated(true);
            setUser(loggedInUser);
            const from = location.state?.from?.pathname || '/projects/nilavanti';
            navigate(from, { replace: true });
            resolve(true);
          } else {
            setError('Invalid password');
            resolve(false);
          }
        } catch (err) {
          console.error('Login error:', err);
          setError('An error occurred during login');
          resolve(false);
        } finally {
          setLoading(false);
        }
      }, 500);
    });
  }, [navigate, location.state]);

  const toggleRegisterForm = useCallback(() => {
    setShowRegisterForm(prev => !prev);
    setError(null);
  }, []);

  const register = useCallback(async (userData: { username: string; email: string; password: string }) => {
    setLoading(true);
    setError(null);
    
    return new Promise<boolean>((resolve) => {
      setTimeout(() => {
        try {
          // In a real app, you would make an API call here to save the user to your database
          // For now, we'll store in memory and localStorage
          const newUser: UserData = {
            ...userData,
            id: Date.now().toString(), // Add unique ID
            createdAt: new Date()
          };
          
          // Save to localStorage (in a real app, this would be an API call)
          const users = JSON.parse(localStorage.getItem('nilavanti_users') || '[]');
          users.push(newUser);
          localStorage.setItem('nilavanti_users', JSON.stringify(users));
          
          // Update state
          setRegisteredUsers(prev => [...prev, newUser]);
          setShowRegisterForm(false);
          setError('Registration successful! You can now log in.');
          setLoading(false);
          resolve(true);
        } catch (err) {
          console.error('Registration error:', err);
          setError('Failed to register. Please try again.');
          setLoading(false);
          resolve(false);
        }
      }, 1000);
    });
  }, []);

  const logout = useCallback(() => {
    // Remove the auth cookie
    Cookies.remove(AUTH_TOKEN);
    setIsAuthenticated(false);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  return (
    <NilavantiAuthContext.Provider
      value={{
        isAuthenticated,
        user,
        login,
        register,
        logout,
        error,
        loading,
        showRegisterForm,
        toggleRegisterForm,
      }}
    >
      {children}
    </NilavantiAuthContext.Provider>
  );
};

export const useNilavantiAuth = (): AuthContextType => {
  const context = useContext(NilavantiAuthContext);
  if (context === undefined) {
    throw new Error('useNilavantiAuth must be used within a NilavantiAuthProvider');
  }
  return context;
};
