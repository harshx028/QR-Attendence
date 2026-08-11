import axios from "axios";
import * as SecureStore from "expo-secure-store";
import Constants from "expo-constants";

const resolveBaseURL = (): string => {
  const explicit = process.env.EXPO_PUBLIC_SERVER_URL;
  if (explicit) return explicit.replace(/\/+$/, "");

  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) {
    const host = hostUri.split(":")[0];
    return `http://${host}:3000`;
  }

  return "http://localhost:3000";
};

const baseURL = resolveBaseURL();

const api = axios.create({
  baseURL,
  timeout: 15000,
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;

