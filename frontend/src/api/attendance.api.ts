import api from "@/api/axios";

export type Attendance = {
  id: string;
  userId: string;
  markedAt: string;
  user?: {
    id: string;
    fullName: string;
    email: string;
  };
};

const markAttendance = async (token: string) => {
  try {
    const res = await api.post("/api/v1/attendance/mark", { token });
    return res.data;
  } catch (error: any) {
    console.error("Mark attendance failed:", error?.response?.data || error.message);
    return error?.response?.data || { success: false, message: "Something went wrong" };
  }
};

const getTodayStatus = async () => {
  try {
    const res = await api.get("/api/v1/attendance/today");
    return res.data;
  } catch (error: any) {
    console.error("Get today status failed:", error?.response?.data || error.message);
    return error?.response?.data || { success: false, message: "Something went wrong" };
  }
};

const getMyAttendance = async () => {
  try {
    const res = await api.get("/api/v1/attendance/me");
    return res.data;
  } catch (error: any) {
    console.error("Get my attendance failed:", error?.response?.data || error.message);
    return error?.response?.data || { success: false, message: "Something went wrong" };
  }
};

const getAllAttendance = async (date?: string) => {
  try {
    const res = await api.get("/api/v1/attendance/all", { params: date ? { date } : undefined });
    return res.data;
  } catch (error: any) {
    console.error("Get all attendance failed:", error?.response?.data || error.message);
    return error?.response?.data || { success: false, message: "Something went wrong" };
  }
};

export { markAttendance, getTodayStatus, getMyAttendance, getAllAttendance };
