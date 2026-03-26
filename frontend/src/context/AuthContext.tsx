import { createContext } from "react";

const AuthContext = createContext(null);

const AuthContextProvider = ({ children }) => {
  return <AuthContext.Provider value={{}}>{children}</AuthContext.Provider>;
};
