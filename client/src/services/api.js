import axios from 'axios';

// Single Axios instance for the whole app. Auth cookies travel automatically
// (withCredentials) and the response interceptor surfaces a consistent error
// message + forces re-login on session expiry.
const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  timeout: 20000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const data = error.response?.data;

    // Session expired or unauthenticated → clear and redirect (skip if already
    // on an auth route to avoid loops).
    if (status === 401) {
      const path = window.location.pathname;
      const onAuthPage = ['/login', '/forgot-password', '/reset-password'].some((p) =>
        path.startsWith(p)
      );
      if (!onAuthPage) {
        localStorage.removeItem('ce_user');
        if (path !== '/login') {
          window.location.href = `/login?expired=1`;
        }
      }
    }

    const message =
      data?.message ||
      (error.code === 'ECONNABORTED'
        ? 'Request timed out. Please try again.'
        : error.message || 'Something went wrong.');

    return Promise.reject({
      message,
      status,
      details: data?.details || null,
      isNetwork: !error.response,
    });
  }
);

export default api;
