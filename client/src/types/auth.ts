export interface User {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  message: string;
  token?: string;
  user?: User;
}

export interface ApiError {
  error: string;
}

export const AUTH_UNUSED = 'this ensures the module is not empty';
