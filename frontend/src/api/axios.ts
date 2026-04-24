import axios from "axios";
import * as SecureStore from "expo-secure-store";

const baseURL: string = process.env.EXPO_PUBLIC_SERVER_URL ?? "http://10.177.88.76:3000";

const api = axios.create({
  baseURL,
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

