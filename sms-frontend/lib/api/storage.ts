import { API_BASE_URL } from './client';

export const storageService = {
  /**
   * Uploads a file to the backend, which forwards it to Supabase Storage.
   * @param file The File object to upload
   * @returns An object containing the public `url`, `fileName`, and `size`.
   */
  async uploadFile(file: File): Promise<{ url: string; fileName: string; size: number }> {
    const token = typeof window !== 'undefined' ? localStorage.getItem('sms_token') : null;
    
    const formData = new FormData();
    formData.append('file', file);

    const res = await fetch(`${API_BASE_URL}/storage/upload`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        // Do NOT set Content-Type header when uploading FormData, 
        // fetch will automatically set it to multipart/form-data with the correct boundary
      },
      body: formData,
    });

    if (!res.ok) {
      if (res.status === 401 && typeof window !== 'undefined') {
        localStorage.removeItem('sms_auth_user');
        localStorage.removeItem('sms_token');
        window.location.href = '/login';
      }
      const error = await res.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message ?? `HTTP ${res.status}`);
    }

    const text = await res.text();
    if (!text) throw new Error('Empty response from server');
    
    return JSON.parse(text);
  }
};
