export async function viewSecureFile(fileUrl: string) {
  // Open the tab immediately before the async fetch to bypass popup blockers
  const newTab = window.open('', '_blank');
  if (newTab) {
    newTab.document.write('<div style="font-family: sans-serif; padding: 2rem; text-align: center; color: #666;">Loading secure document...</div>');
  }

  try {
    // Convert public URL to authenticated URL if needed
    const authenticatedUrl = fileUrl.replace('/object/public/', '/object/authenticated/');
    const token = localStorage.getItem('sms_token');
    
    const res = await fetch(authenticatedUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!res.ok) {
      if (res.status === 404) throw new Error('File not found or access denied.');
      throw new Error(`Error downloading file: ${res.status}`);
    }
    
    // Explicitly set the blob type to application/pdf so the browser knows to render it
    const rawBlob = await res.blob();
    const blob = new Blob([rawBlob], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);
    
    if (newTab) {
      newTab.location.href = blobUrl;
    } else {
      // Fallback if popup blocker blocked the initial open
      window.location.href = blobUrl;
    }
    
    // We intentionally don't revoke the ObjectURL immediately because the new tab needs time to load it.
    // The browser will clean it up when the tab is closed or session ends.
    
  } catch (error: any) {
    console.error('View failed:', error);
    if (newTab) newTab.close();
    alert(error.message || 'Failed to view the file securely.');
  }
}
