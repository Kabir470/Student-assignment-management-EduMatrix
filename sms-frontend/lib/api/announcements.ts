import { apiCall } from './client';
import type { Announcement } from '../types';

export const announcementsService = {
  async getAll(): Promise<Announcement[]> {
    return apiCall<Announcement[]>('/announcements');
  },

  async create(input: { title: string; content: string; isGlobal?: boolean }): Promise<{ id: string }> {
    return apiCall('/announcements', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async delete(id: string): Promise<void> {
    return apiCall(`/announcements/${id}`, { method: 'DELETE' });
  },
};
