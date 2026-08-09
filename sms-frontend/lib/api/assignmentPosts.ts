import { apiCall } from './client';
import type { AssignmentPost } from '../types';

export const assignmentPostsService = {
  getPosts: async (assignmentId: string): Promise<AssignmentPost[]> => {
    return apiCall<AssignmentPost[]>(`/assignments/${assignmentId}/posts`);
  },

  createPost: async (assignmentId: string, content: string): Promise<{ id: string }> => {
    return apiCall(`/assignments/${assignmentId}/posts`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  createComment: async (postId: string, content: string): Promise<{ id: string }> => {
    return apiCall(`/assignments/posts/${postId}/comments`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  },

  deletePost: async (postId: string): Promise<void> => {
    return apiCall(`/assignments/posts/${postId}`, {
      method: 'DELETE',
    });
  }
};
