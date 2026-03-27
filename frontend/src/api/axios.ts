import axios from "axios";
const baseURL: string = process.env.SERVER_URL ?? "http://localhost:8000";
const authToken: string = "xyz";
const config = {
  baseURL,
  headers: {
    Authorization: `Bearer ${authToken}`,
  },
};
const api = axios.create(config);

export default api;
