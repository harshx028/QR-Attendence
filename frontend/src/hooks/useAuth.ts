import { AuthContext } from "@/context/AuthContext";
import { useContext } from "react";

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) console.error("Auth Context Must be used within AuthProvider");
  return context;
};

export default useAuth;
