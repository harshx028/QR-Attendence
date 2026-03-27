import api from "@/api/axios";
import useAuth from "@/hooks/useAuth";

type LoginCreds = {
  email: string
  password: string
}
type SignupCreds = {
  full_name: string
  email: string
  password: string
}
const verifyAuth = async () => {
  const { setIsAuthenticated, setUser, setIsLoading } = useAuth()
  setIsLoading(true)
  try {
    const res = await api.post("/api/v1/auth/");
    setIsAuthenticated(true)
    setUser(res.data.data)
  } catch (error) {
    console.log("Something went Wrong", error)
    setIsAuthenticated(false)
  } finally {
    setIsLoading(false)
  }
};
const login = async (creds: LoginCreds) => {
  const { setIsAuthenticated, setUser } = useAuth()
  try {
    const { email, password } = creds
    const res = await api.post("/api/v1/auth/login", creds)
    setIsAuthenticated(true)
    setUser(res.data.data)
  } catch (error) {
    console.log("Something went Wrong", error)
    setIsAuthenticated(false)
  }
}

const signup = async (creds: SignupCreds) => {
  const { setIsAuthenticated, setUser } = useAuth()
  try {
    const { email, password } = creds
    const res = await api.post("/api/v1/auth/signup", creds)
    setIsAuthenticated(true)
    setUser(res.data.data)
  } catch (error) {
    console.log("Something went Wrong", error)
    setIsAuthenticated(false)
  }
}