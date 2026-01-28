/**
 * API Endpoints Map
 * Single source of truth for all backend endpoint paths
 * baseURL is /api (via Vite proxy or axios)
 * All paths here are relative to /api
 */

// --------------------
// Auth endpoints
// --------------------
export const AUTH_REGISTER = '/auth/register';
export const AUTH_LOGIN = '/auth/login';
export const AUTH_LOGOUT = '/auth/logout';
export const AUTH_ME = '/auth/me';
export const AUTH_VERIFY_EMAIL = '/auth/verify-email';
export const AUTH_FORGOT_PASSWORD = '/auth/forgot-password';
export const AUTH_VERIFY_OTP = '/auth/verify-otp';
export const AUTH_RESET_PASSWORD = '/auth/reset-password';
export const AUTH_VALIDATE_PASSWORD = '/auth/validate-password';

// --------------------
// Products endpoints (clinic services)
// backend mounts: /api/products
// --------------------
export const PRODUCTS_LIST = '/products';
export const PRODUCT_DETAIL = (id) => `/products/${id}`;
export const PRODUCTS_DETAIL = (id) => `/products/${id}`; // Alias for compatibility

export const PRODUCTS_CREATE = '/products';
export const PRODUCT_UPDATE = (id) => `/products/${id}`;
export const PRODUCT_DELETE = (id) => `/products/${id}`;

// --------------------
// Doctors endpoints
// --------------------
export const DOCTORS_LIST = '/doctors';
export const DOCTOR_DETAIL = (id) => `/doctors/${id}`;

// --------------------
// Departments endpoints
// --------------------
export const DEPARTMENTS_LIST = '/departments';

// --------------------
// Appointments endpoints
// --------------------
export const APPOINTMENTS_CREATE = '/appointments';
export const APPOINTMENTS_ME = '/appointments/me';
export const APPOINTMENT_DETAIL = (id) => `/appointments/${id}`;
export const APPOINTMENTS_DOCTOR = '/appointments/doctor';
export const APPOINTMENT_UPDATE_STATUS = (id) => `/appointments/${id}/status`;

// --------------------
// Slots endpoints
// --------------------
export const SLOTS_LIST = '/slots';

// --------------------
// Payments endpoints
// backend mounts: /api/payments
// --------------------
export const PAYMENT_ESEWA_INITIATE = '/payments/esewa/initiate';
export const PAYMENT_ESEWA_SUCCESS = '/payments/esewa/success';
export const PAYMENT_ESEWA_FAILURE = '/payments/esewa/failure';
export const PAYMENT_VERIFY = (appointmentId) => `/payments/verify/${appointmentId}`;

// --------------------
// Users endpoints
// --------------------
export const USERS_PROFILE = '/users/profile';
export const USERS_2FA_SETUP = '/users/2fa/setup';
export const USERS_2FA_ENABLE = '/users/2fa/enable';

// --------------------
// Admin endpoints
// --------------------
export const ADMIN_DASHBOARD = '/admin/dashboard';
export const ADMIN_USERS = '/admin/users';

