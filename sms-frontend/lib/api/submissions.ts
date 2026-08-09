import { apiCall } from './client';
import type { Submission, SubmissionCreateInput, SubmissionGradeInput, SubmissionComment } from '../types';

export const submissionsService = {
  async getAll(query: any = {}): Promise<{ data: Submission[], totalCount: number, page: number, pageSize: number }> {
    const params = new URLSearchParams({
      page: (query.page || 1).toString(),
      pageSize: (query.limit || 100).toString(),
    });
    if (query.assignmentId) params.append('assignmentId', query.assignmentId);
    if (query.studentId) params.append('studentId', query.studentId);
    if (query.teacherId) params.append('teacherId', query.teacherId);
    if (query.status && query.status !== 'all') params.append('status', query.status);

    return apiCall(`/submissions?${params.toString()}`);
  },

  async getMySubmissions(query: any = {}): Promise<{ data: Submission[], totalCount: number, page: number, pageSize: number }> {
    const params = new URLSearchParams({
      page: (query.page || 1).toString(),
      pageSize: (query.limit || 100).toString(),
    });
    if (query.assignmentId) params.append('assignmentId', query.assignmentId);
    if (query.status && query.status !== 'all') params.append('status', query.status);

    return apiCall(`/submissions/my-submissions?${params.toString()}`);
  },
  
  async getByStudentAndAssignment(studentId: string, assignmentId: string): Promise<Submission | null> {
    const res = await this.getMySubmissions({ assignmentId });
    return res.data.find(s => s.assignmentId === assignmentId) || null;
  },

  async getById(id: string): Promise<Submission> {
    return apiCall(`/submissions/${id}`);
  },

  async create(input: Omit<SubmissionCreateInput, 'studentId'> | any): Promise<string> {
    return apiCall('/submissions', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async updateSubmission(id: string, input: Omit<SubmissionCreateInput, 'studentId'> | any): Promise<void> {
    return apiCall(`/submissions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(input),
    });
  },

  async delete(id: string): Promise<void> {
    return apiCall(`/submissions/${id}`, {
      method: 'DELETE',
    });
  },

  async grade(id: string, input: SubmissionGradeInput): Promise<void> {
    return apiCall(`/submissions/${id}/grade`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    });
  },

  async getComments(submissionId: string): Promise<SubmissionComment[]> {
    return apiCall<SubmissionComment[]>(`/submissions/${submissionId}/comments`);
  },

  async addComment(submissionId: string, content: string): Promise<SubmissionComment> {
    return apiCall(`/submissions/${submissionId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  async deleteComment(submissionId: string, commentId: string): Promise<void> {
    return apiCall(`/submissions/${submissionId}/comments/${commentId}`, { method: 'DELETE' });
  },
};
