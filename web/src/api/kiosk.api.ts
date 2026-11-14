import api from "./axios";

export type KioskQr = {
  success: boolean;
  message?: string;
  token?: string;
  updatedAt?: string;
  expiresAt?: string;
  rotationSeconds?: number;
  serverTime?: string;
  /** HTTP status when the request failed (401 = signed out). */
  status?: number;
};

export const getKioskQr = async (): Promise<KioskQr> => {
  try {
    const res = await api.get("/api/v1/kiosk/qr");
    return res.data;
  } catch (error: any) {
    return {
      success: false,
      status: error?.response?.status,
      message: error?.response?.data?.message || "Can't reach the server",
    };
  }
};
