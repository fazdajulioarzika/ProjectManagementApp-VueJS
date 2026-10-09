import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 90000,
});

// Setiap request otomatis membawa token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const isLoginRequest = error.config?.url?.includes("/auth/login");

    // Token tidak valid / kedaluwarsa -> paksa login ulang
    if (status === 401 && !isLoginRequest) {
      localStorage.removeItem("token");
      if (location.pathname !== "/login") location.href = "/login";
    }

    // Pakai pesan dari backend agar mudah ditampilkan di UI
    error.message = error.response?.data?.message || error.message;
    return Promise.reject(error);
  }
);

export default api;
