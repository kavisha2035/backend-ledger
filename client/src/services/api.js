import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // critical for cookie support
});

// Request interceptor to add authorization header if token exists in localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh upon 401 Unauthorized errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Check if error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry && !originalRequest.url.includes("/auth/refresh")) {
      originalRequest._retry = true;
      try {
        // Attempt token refresh via rotated HTTP-Only cookie
        const res = await axios.post(
          `${API_URL}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        
        const newToken = res.data.token;
        localStorage.setItem("token", newToken);
        
        // Retry original request with new token
        api.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
        originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh failed (token expired/invalid), force client-side logout
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email, password) => {
    const response = await api.post("/auth/login", { email, password });
    if (response.data?.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },

  register: async (email, password, name) => {
    const response = await api.post("/auth/register", { email, password, name });
    if (response.data?.token) {
      localStorage.setItem("token", response.data.token);
    }
    return response.data;
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
    }
  },
};

export const accountService = {
  getAll: async () => {
    const response = await api.get("/accounts");
    // Map Prisma's `id` to `_id` for frontend backward compatibility
    return (response.data.accounts || []).map(acc => ({ ...acc, _id: acc.id || acc._id }));
  },

  create: async (currency = "INR") => {
    const response = await api.post("/accounts", { currency });
    const acc = response.data.account;
    return { ...acc, _id: acc.id || acc._id };
  },

  getBalance: async (accountId) => {
    const response = await api.get(`/accounts/balance/${accountId}`);
    return response.data.balance;
  },
};

export const transactionService = {
  getAll: async (accountId, params = {}) => {
    const response = await api.get("/transactions", {
      params: { accountId, ...params }
    });
    return response.data;
  },

  create: async (fromAccount, toAccount, amount, idempotencyKey, description = "") => {
    const response = await api.post("/transactions", {
      fromAccount,
      toAccount,
      amount: Number(amount),
      idempotencyKey,
      description
    });
    return response.data;
  },

  createInitialFunds: async (toAccount, amount, idempotencyKey, description = "") => {
    const response = await api.post("/transactions/system/initial-funds", {
      toAccount,
      amount: Number(amount),
      idempotencyKey,
      description
    });
    return response.data;
  },

  exportStatement: async (accountId, from = "", to = "") => {
    const response = await api.get("/transactions/export", {
      params: { accountId, from, to },
      responseType: "blob"
    });
    return response.data;
  }
};

export default api;
