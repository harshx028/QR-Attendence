import api from "./axios";

export type AppUser = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  createdAt: string;
};

const getAllUsers = async (): Promise<{ success: boolean; users?: AppUser[]; message?: string }> => {
  try {
    const res = await api.get("/api/v1/user");
    return res.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: "Something went wrong" };
  }
};

export { getAllUsers };
