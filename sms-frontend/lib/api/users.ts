import { apiCall } from './client';
import type { User, UserCreateInput, UserUpdateInput } from '../types';

export const usersService = {
  async getAll(query: any = {}): Promise<{ data: User[], totalCount: number, page: number, pageSize: number }> {
    const params = new URLSearchParams({
      page: (query.page || 1).toString(),
      pageSize: (query.limit || 10).toString(),
    });
    if (query.search) params.append('search', query.search);
    if (query.role && query.role !== 'all') params.append('role', query.role);

    return apiCall(`/users?${params.toString()}`);
  },

  async getById(id: string): Promise<User> {
    return apiCall(`/users/${id}`);
  },

  async create(input: UserCreateInput): Promise<string> {
    return apiCall('/users', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async update(id: string, input: UserUpdateInput): Promise<void> {
    return apiCall(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async delete(id: string): Promise<void> {
    return apiCall(`/users/${id}`, {
      method: 'DELETE',
    });
  },
  
  async toggleActive(id: string): Promise<void> {
    return apiCall(`/users/${id}/toggle-active`, {
      method: 'PATCH',
    });
  },

  async getNextId(role: string): Promise<{ nextId: string }> {
    return apiCall(`/users/next-id?role=${role}`);
  }
};
