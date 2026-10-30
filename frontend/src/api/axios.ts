import axios from "axios";
import * as SecureStore from "expo-secure-store";

const getBaseURL = async (): Promise<string> => {
  try {
    const savedUrl = await SecureStore.getItemAsync("server_url");
    if (savedUrl) {
      return savedUrl;
    }
  } catch (error) {
    console.error("Error getting server URL:", error);
  }
  return "https://attendence.durga-foundation.org";
};

const api = axios.create({
  baseURL: "https://attendence.durga-foundation.org",
});

api.interceptors.request.use(
  async (config) => {
    const token = await SecureStore.getItemAsync("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Update baseURL dynamically from SecureStore
    const savedUrl = await SecureStore.getItemAsync("server_url");
    if (savedUrl && config.baseURL !== savedUrl) {
      config.baseURL = savedUrl;
    } else if (!savedUrl && process.env.EXPO_PUBLIC_SERVER_URL && config.baseURL !== process.env.EXPO_PUBLIC_SERVER_URL) {
      config.baseURL = process.env.EXPO_PUBLIC_SERVER_URL;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
export { getBaseURL };


