import { apiCall } from './client';
import type { Assignment, AssignmentCreateInput, AssignmentUpdateInput, AssignmentStatus } from '../types';

export const assignmentsService = {
  async getAll(query: any = {}): Promise<{ data: Assignment[], totalCount: number, page: number, pageSize: number }> {
    const params = new URLSearchParams({
      page: (query.page || 1).toString(),
      pageSize: (query.limit || 100).toString(),
    });
    if (query.search) params.append('search', query.search);
    if (query.courseId) params.append('courseId', query.courseId);
    if (query.teacherId) params.append('teacherId', query.teacherId);
    if (query.status && query.status !== 'all') params.append('status', query.status);

    return apiCall(`/assignments?${params.toString()}`);
  },

  async getMyAssignments(query: any = {}): Promise<{ data: Assignment[], totalCount: number, page: number, pageSize: number }> {
    const params = new URLSearchParams({
      page: (query.page || 1).toString(),
      pageSize: (query.limit || 100).toString(),
    });
    if (query.search) params.append('search', query.search);
    if (query.courseId) params.append('courseId', query.courseId);
    if (query.status && query.status !== 'all') params.append('status', query.status);

    return apiCall(`/assignments/my-assignments?${params.toString()}`);
  },
  
  async getForStudent(studentId: string): Promise<Assignment[]> {
    const res = await this.getMyAssignments({ limit: 100 });
    return res.data;
  },

  async getById(id: string): Promise<Assignment> {
    return apiCall(`/assignments/${id}`);
  },

  async create(input: Omit<AssignmentCreateInput, 'teacherId' | 'teacherName' | 'courseName'> | any): Promise<string> {
    return apiCall('/assignments', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async update(id: string, input: AssignmentUpdateInput): Promise<void> {
    return apiCall(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async delete(id: string): Promise<void> {
    return apiCall(`/assignments/${id}`, {
      method: 'DELETE',
    });
  },

  async publish(id: string): Promise<void> {
    return apiCall(`/assignments/${id}/publish`, {
      method: 'PATCH',
    });
  },

  async archive(id: string): Promise<void> {
    return apiCall(`/assignments/${id}/archive`, {
      method: 'PATCH',
    });
  }
};
