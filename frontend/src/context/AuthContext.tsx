import {
  createContext,
  PropsWithChildren,
  useState,
  useEffect,
  useCallback,
} from "react";
import * as SecureStore from "expo-secure-store";
import { login as apiLogin, signup as apiSignup, verifyAuth as apiVerifyAuth } from "@/api/auth.api";

type User = {
  id: string;
  fullName: string;
  email: string;
} | null;

type AuthContextValue = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User;
  login: (creds: any) => Promise<{ success: boolean; message: string }>;
  signup: (creds: any) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const AuthProvider = ({ children }: PropsWithChildren) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User>(null);

  const initAuth = useCallback(async () => {
    try {
      const token = await SecureStore.getItemAsync("token");
      if (token) {
        const res = await apiVerifyAuth();
        if (res && res.user) {
          setUser(res.user);
          setIsAuthenticated(true);
        } else {
          await SecureStore.deleteItemAsync("token");
        }
      }
    } catch (error) {
      console.error("Auth initialization failed:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (creds: any) => {
    try {
      const res = await apiLogin(creds);
      if (res.success && res.token) {
        await SecureStore.setItemAsync("token", res.token);
        setUser(res.user);
        setIsAuthenticated(true);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || "Login failed" };
    } catch (error: any) {
      return { success: false, message: error.message || "An error occurred during login" };
    }
  };

  const signup = async (creds: any) => {
    try {
      const res = await apiSignup(creds);
      if (res.success && res.token) {
        await SecureStore.setItemAsync("token", res.token);
        setUser(res.user);
        setIsAuthenticated(true);
        return { success: true, message: res.message };
      }
      return { success: false, message: res.message || "Signup failed" };
    } catch (error: any) {
      return { success: false, message: error.message || "An error occurred during signup" };
    }
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync("token");
    setUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider
      value={{
        isLoading,
        isAuthenticated,
        user,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };

