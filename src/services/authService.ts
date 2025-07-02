import { User } from '../types';

const USER_STORAGE_KEY = 'klyr_user';
const TOKEN_STORAGE_KEY = 'klyr_token';

// Maps backend user object (with _id) to frontend User type (with user_id)
const mapBackendUserToFrontendUser = (backendUser: any): User => {
  if (!backendUser) return backendUser;
  const frontendUser = { ...backendUser, user_id: backendUser._id };
  delete frontendUser._id;
  return frontendUser;
};

class AuthService {
  async login(email: string, password: string): Promise<User> {
    const response = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to login');
    }

    const { user: backendUser, token } = await response.json();
    const user = mapBackendUserToFrontendUser(backendUser);

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_STORAGE_KEY, token);

    return user;
  }

  async register(name: string, email: string, password: string): Promise<User> {
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to register');
    }

    const { user: backendUser, token } = await response.json();
    const user = mapBackendUserToFrontendUser(backendUser);

    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    localStorage.setItem(TOKEN_STORAGE_KEY, token);

    return user;
  }

  getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  async getCurrentUser(): Promise<User | null> {
    const stored = localStorage.getItem(USER_STORAGE_KEY);
    return stored ? JSON.parse(stored) : null;
  }

  logout(): void {
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }

  updateCurrentUser(user: User): void {
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  }
}

export const authService = new AuthService();

export const updateProfile = async (userId: string, data: { name: string; email: string }): Promise<User> => {
  const token = authService.getToken();
  if (!token) throw new Error('No token found');

  const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update profile');
  }

  const updatedBackendUser = await response.json();
  const updatedUser = mapBackendUserToFrontendUser(updatedBackendUser);
  authService.updateCurrentUser(updatedUser);
  return updatedUser;
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
  const token = authService.getToken();
  if (!token) throw new Error('No token found');

  const response = await fetch('http://localhost:3001/api/auth/change-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ currentPassword, newPassword }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to change password');
  }
};