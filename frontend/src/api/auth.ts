import api from './client';

export interface LoginResponse {
  access_token: string;
  token_type: string;
  role: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const form = new URLSearchParams();
  form.append('username', email);
  form.append('password', password);
  const res = await api.post<LoginResponse>('/auth/login', form, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });
  return res.data;
}

export async function register(payload: RegisterPayload) {
  const res = await api.post('/auth/register', payload);
  return res.data;
}
