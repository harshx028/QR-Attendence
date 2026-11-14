import api from "./axios";

export type Attendance = {
  id: string;
  userId: string;
  date: string;
  markedAt: string;
  checkInAt?: string;
  checkOutAt?: string | null;
  remarks?: string | null;
  user?:{ id: string; fullName: string; email: string };
};

export type TodayStatus = {
  success: boolean;
  marked: boolean;
  checkedIn: boolean;
  checkedOut: boolean;
  attendance: {
    date: string;
    markedAt: string;
    checkInAt: string;
    checkOutAt: string | null;
  } | null;
};

const markAttendance = async (
  token: string,
  lat?: number | null,
  lng?: number | null,
  remarks?: string | null
) => {
  try {
    const res = await api.post("/api/v1/attendance/mark", {
      token,
      lat: lat ?? null,
      lng: lng ?? null,
      remarks: remarks || null,
    });
    return res.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: "Something went wrong" };
  }
};

const markGuestAttendance = async (params: {
  token: string;
  fullName: string;
  phone: string;
  lat?: number | null;
  lng?: number | null;
}) => {
  try {
    const res = await api.post("/api/v1/attendance/guest/mark", {
      ...params,
      lat: params.lat ?? null,
      lng: params.lng ?? null,
    });
    return res.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: "Something went wrong" };
  }
};

const getTodayStatus = async (): Promise<TodayStatus> => {
  try {
    const res = await api.get("/api/v1/attendance/today");
    return res.data;
  } catch {
    return { success: false, marked: false, checkedIn: false, checkedOut: false, attendance: null };
  }
};

export type MyAttendanceResponse = {
  success: boolean;
  message?: string;
  attendances?: Attendance[];
  /** Server's current IST date, YYYY-MM-DD */
  today?: string;
  /** User's account creation date (IST), YYYY-MM-DD */
  joinedOn?: string | null;
};

/** @param month optional "YYYY-MM" to fetch a single month */
const getMyAttendance = async (month?: string): Promise<MyAttendanceResponse> => {
  try {
    const res = await api.get("/api/v1/attendance/me", {
      params: month ? { month } : undefined,
    });
    return res.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: "Something went wrong" };
  }
};

const getAllAttendance = async (date?: string) => {
  try {
    const res = await api.get("/api/v1/attendance/all", {
      params: date ? { date } : undefined,
    });
    return res.data;
  } catch (error: any) {
    return error?.response?.data || { success: false, message: "Something went wrong" };
  }
};

export { markAttendance, markGuestAttendance, getTodayStatus, getMyAttendance, getAllAttendance };

export type GuestEntry = {
  fullName: string;
  phone: string;
  email?: string;
  address?: string;
  purpose: string;
  remarks?: string;
};

/** Public guest visit form (no QR scan needed). */
export const submitGuestEntry = async (entry: GuestEntry) => {
  try {
    const res = await api.post("/api/v1/attendance/guest/entry", entry);
    return res.data as { success: boolean; message: string };
  } catch (error: any) {
    return (error?.response?.data || { success: false, message: "Something went wrong" }) as {
      success: boolean;
      message: string;
    };
  }
};
