import {
  createContext,
  PropsWithChildren,
  Dispatch,
  SetStateAction,
  useState,
} from "react";

type AuthContextValue = {
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  isAuthenticated: boolean;
  setIsAuthenticated: Dispatch<SetStateAction<boolean>>;
  user: object | null;
  setUser: Dispatch<SetStateAction<object | null>>;
};
const AuthContext = createContext<AuthContextValue | null>(null);

const AuthProvider = ({ children }: PropsWithChildren) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<object | null>(null);
  return (
    <AuthContext.Provider
      value={{
        isLoading,
        setIsLoading,
        isAuthenticated,
        setIsAuthenticated,
        user,
        setUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthContext, AuthProvider };
