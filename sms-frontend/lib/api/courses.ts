import { apiCall } from './client';
import type { Course, CourseCreateInput, CourseUpdateInput, EnrolledStudent } from '../types';

export const coursesService = {
  async getAll(query: any = {}): Promise<{ data: Course[], totalCount: number, page: number, pageSize: number }> {
    const params = new URLSearchParams({
      page: (query.page || 1).toString(),
      pageSize: (query.limit || 10).toString(),
    });
    if (query.search) params.append('search', query.search);
    if (query.teacherId) params.append('teacherId', query.teacherId);
    if (query.studentId) params.append('studentId', query.studentId);

    return apiCall(`/courses?${params.toString()}`);
  },

  async getMyCourses(query: any = {}): Promise<{ data: Course[], totalCount: number, page: number, pageSize: number }> {
    const params = new URLSearchParams({
      page: (query.page || 1).toString(),
      pageSize: (query.limit || 10).toString(),
    });
    if (query.search) params.append('search', query.search);

    return apiCall(`/courses/my-courses?${params.toString()}`);
  },

  async getById(id: string): Promise<Course> {
    return apiCall(`/courses/${id}`);
  },

  async create(input: CourseCreateInput): Promise<string> {
    return apiCall('/courses', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async update(id: string, input: CourseUpdateInput): Promise<void> {
    return apiCall(`/courses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async delete(id: string): Promise<void> {
    return apiCall(`/courses/${id}`, {
      method: 'DELETE',
    });
  },

  async enrollStudent(courseId: string, studentId: string): Promise<void> {
    return apiCall(`/courses/${courseId}/enroll/${studentId}`, {
      method: 'POST',
    });
  },

  async removeStudent(courseId: string, studentId: string): Promise<void> {
    return apiCall(`/courses/${courseId}/enroll/${studentId}`, {
      method: 'DELETE',
    });
  },

  async getEnrolledStudents(courseId: string): Promise<EnrolledStudent[]> {
    return apiCall<EnrolledStudent[]>(`/courses/${courseId}/students`);
  },
};
