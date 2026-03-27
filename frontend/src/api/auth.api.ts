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
    return true
  } catch (error) {
    console.log("Something went Wrong", error)
    setIsAuthenticated(false)
    return false
  } finally {
    setIsLoading(false)
  }
};
const login = async (creds: LoginCreds) => {
  const { setIsAuthenticated, setUser } = useAuth()
  try {
    const res = await api.post("/api/v1/auth/login", creds)
    setIsAuthenticated(true)
    setUser(res.data.data)
    return res.data
  } catch (error) {
    console.log("Something went Wrong", error)
    setIsAuthenticated(false)
    return error.response.data || { status: false, msg: "Something went wrong" }
  }
}
const signup = async (creds: SignupCreds) => {
  const { setIsAuthenticated, setUser } = useAuth()
  try {
    const { email, password } = creds
    const res = await api.post("/api/v1/auth/signup", creds)
    setIsAuthenticated(true)
    setUser(res.data.data)
    return res.data
  } catch (error: any) {
    console.log("Something went Wrong", error)
    setIsAuthenticated(false)
    return error.response.data || { status: false, msg: "Something went wrong" }
  }
}

export { verifyAuth, login, signup }