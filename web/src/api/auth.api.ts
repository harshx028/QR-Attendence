import api from "./axios";

type LoginCreds = { email: string; password: string };
type SignupCreds = { fullName: string; email: string; password: string };

const verifyAuth = async () => {
  try {
    const res = await api.get("/api/v1/user/me");
    return res.data;
  } catch {
    return null;
  }
};

const login = async (creds: LoginCreds) => {
  try {
    const res = await api.post("/api/v1/auth/login", creds);
    return res.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: "Something went wrong" };
  }
};

const signup = async (creds: SignupCreds) => {
  try {
    const res = await api.post("/api/v1/auth/signup", creds);
    return res.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: "Something went wrong" };
  }
};

const logout = async () => {
  try {
    await api.post("/api/v1/auth/logout");
  } catch {
    // ignore
  }
};

export { verifyAuth, login, signup, logout };
