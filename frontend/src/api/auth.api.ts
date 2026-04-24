import api from "@/api/axios";

type LoginCreds = {
  email: string;
  password: string;
};

type SignupCreds = {
  fullName: string;
  email: string;
  password: string;
};

const verifyAuth = async () => {
  try {
    const res = await api.get("/api/v1/user/me");
    return res.data;
  } catch (error: any) {
    console.error("Verify auth failed:", error?.response?.data || error.message);
    return null;
  }
};

const login = async (creds: LoginCreds) => {
  try {
    const res = await api.post("/api/v1/auth/login", creds);
    return res.data;
  } catch (error: any) {
    console.error("Login failed:", error?.response?.data || error.message);
    return error?.response?.data || { success: false, message: "Something went wrong" };
  }
};

const signup = async (creds: SignupCreds) => {
  try {
    const res = await api.post("/api/v1/auth/signup", creds);
    return res.data;
  } catch (error: any) {
    console.error("Signup failed:", error?.response?.data || error.message);
    return error?.response?.data || { success: false, message: "Something went wrong" };
  }
};

export { verifyAuth, login, signup };

