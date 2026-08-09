import React, { useState, useEffect } from 'react';
import { Send, Trash2, User as UserIcon, Maximize2 } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { assignmentPostsService } from '@/lib/api/assignmentPosts';
import type { AssignmentPost } from '@/lib/types';
import { getInitials } from '@/lib/utils';
import { useAuth } from '@/lib/auth/context';

interface AssignmentDiscussionProps {
  assignmentId: string;
}

export default function AssignmentDiscussion({ assignmentId }: AssignmentDiscussionProps) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<AssignmentPost[]>([]);
  const [newPostContent, setNewPostContent] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    loadPosts();
  }, [assignmentId]);

  const loadPosts = async () => {
    try {
      const data = await assignmentPostsService.getPosts(assignmentId);
      // Sort by oldest first if preferred, or leave as is. Google classroom usually shows newest at bottom.
      // Assuming API returns newest first, we reverse it to show newest at bottom:
      setPosts(data.reverse());
    } catch (e) {
      console.error('Failed to load posts', e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!newPostContent.trim()) return;
    try {
      await assignmentPostsService.createPost(assignmentId, newPostContent);
      setNewPostContent('');
      loadPosts();
    } catch (e) {
      console.error('Failed to create post', e);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) return;
    try {
      await assignmentPostsService.deletePost(postId);
      loadPosts();
    } catch (e) {
      console.error('Failed to delete post', e);
    }
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString() === new Date().toLocaleDateString()
      ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (isLoading) return <div className="skeleton" style={{ height: 100, borderRadius: 'var(--radius-lg)' }} />;

  const renderContent = (expanded: boolean) => (
    <>
      {/* Comments List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: expanded ? '60vh' : '400px', overflowY: 'auto', paddingRight: '0.5rem' }}>
        {posts.length === 0 ? (
          <div className="empty-state" style={{ padding: '2rem 0' }}>
            <p>No class comments yet.</p>
          </div>
        ) : (
          posts.map(post => (
            <div key={post.id} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <div className="avatar avatar-sm" style={{
                background: post.authorRole === 'teacher' ? 'var(--color-info)' : 'var(--color-success)',
                flexShrink: 0
              }}>
                {getInitials(post.authorName.split(' ')[0] || '', post.authorName.split(' ')[1] || '')}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{post.authorName}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{formatTime(post.createdAt)}</span>
                  </div>
                  {(user?.id === post.authorId || user?.role === 'teacher' || user?.role === 'admin') && (
                    <button className="btn btn-ghost btn-icon btn-sm" onClick={() => handleDeletePost(post.id)} style={{ padding: '2px', height: 'auto', minHeight: 'auto' }}>
                      <Trash2 size={13} style={{ color: 'var(--color-danger)' }} />
                    </button>
                  )}
                </div>
                <p style={{ fontSize: '0.9rem', lineHeight: 1.5, color: 'var(--color-text)', whiteSpace: 'pre-wrap' }}>
                  {post.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add Comment Input */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem', marginTop: 'auto' }}>
        <div className="avatar avatar-sm" style={{ background: 'var(--color-primary)', flexShrink: 0 }}>
          {user ? getInitials(user.firstName, user.lastName) : <UserIcon size={16} />}
        </div>
        <div style={{ flex: 1, display: 'flex', gap: '0.5rem' }}>
          <textarea
            className="input"
            placeholder="Add a class comment..."
            rows={1}
            value={newPostContent}
            onChange={(e) => {
              e.target.style.height = 'auto';
              e.target.style.height = e.target.scrollHeight + 'px';
              setNewPostContent(e.target.value);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleCreatePost();
              }
            }}
            style={{ minHeight: '36px', padding: '0.5rem 0.75rem', fontSize: '0.875rem' }}
          />
          <button
            className="btn btn-primary"
            style={{ padding: '0.5rem', width: '36px', height: '36px', flexShrink: 0 }}
            disabled={!newPostContent.trim()}
            onClick={handleCreatePost}
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', position: 'relative' }}>
        <button
          className="btn btn-ghost btn-icon btn-sm"
          onClick={() => setIsExpanded(true)}
          title="Expand Comments"
          style={{ position: 'absolute', top: '0.20rem', right: '0.20rem', zIndex: 10 }}
        >
          <Maximize2 size={16} />
        </button>
        {renderContent(false)}
      </div>

      <Modal isOpen={isExpanded} onClose={() => setIsExpanded(false)} title="Class Comments" size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {renderContent(true)}
        </div>
      </Modal>
    </>
  );
}
