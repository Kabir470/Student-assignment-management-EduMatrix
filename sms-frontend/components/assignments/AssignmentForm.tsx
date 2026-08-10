'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Modal from '@/components/ui/Modal';
import type { Assignment, AssignmentCreateInput, Course } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { storageService } from '@/lib/api/storage';
import { Paperclip, X } from 'lucide-react';

const schema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  courseId: z.string().min(1, 'Please select a course'),
  dueDate: z.string().min(1, 'Due date is required'),
  totalMarks: z.coerce.number().min(1, 'Total marks must be at least 1').max(1000),
  status: z.enum(['draft', 'published', 'archived']),
  maxFileSizeMb: z.coerce.number().optional(),
  allowLateSubmissions: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

interface AssignmentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<AssignmentCreateInput, 'teacherId' | 'teacherName' | 'courseName'>) => Promise<void>;
  assignment?: Assignment | null;
  initialDraft?: Partial<AssignmentCreateInput> | null;
  courses: Course[];
  title?: string;
  defaultCourseId?: string;
}

export default function AssignmentForm({ isOpen, onClose, onSubmit, assignment, initialDraft, courses, title = 'Create Assignment', defaultCourseId }: AssignmentFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: assignment ? {
      title: assignment.title,
      description: assignment.description,
      courseId: assignment.courseId,
      dueDate: assignment.dueDate.slice(0, 16),
      totalMarks: assignment.totalMarks,
      status: assignment.status,
      maxFileSizeMb: assignment.maxFileSizeMb,
      allowLateSubmissions: assignment.allowLateSubmissions ?? true,
    } : {
      title: initialDraft?.title || '',
      description: initialDraft?.description || '',
      dueDate: initialDraft?.dueDate ? initialDraft.dueDate.slice(0, 16) : '',
      status: 'draft',
      totalMarks: initialDraft?.totalMarks || 100,
      maxFileSizeMb: 10,
      courseId: initialDraft?.courseId || defaultCourseId || '',
      allowLateSubmissions: initialDraft?.allowLateSubmissions ?? true,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (assignment) {
        reset({
          title: assignment.title,
          description: assignment.description,
          courseId: assignment.courseId,
          dueDate: assignment.dueDate.slice(0, 16),
          totalMarks: assignment.totalMarks,
          status: assignment.status,
          maxFileSizeMb: assignment.maxFileSizeMb,
          allowLateSubmissions: assignment.allowLateSubmissions ?? true,
        });
      } else if (initialDraft) {
        reset({
          title: initialDraft.title || '',
          description: initialDraft.description || '',
          dueDate: initialDraft.dueDate ? initialDraft.dueDate.slice(0, 16) : '',
          status: 'draft',
          totalMarks: initialDraft.totalMarks || 100,
          maxFileSizeMb: 10,
          courseId: initialDraft.courseId || defaultCourseId || '',
          allowLateSubmissions: initialDraft.allowLateSubmissions ?? true,
        });
      } else {
        reset({
          status: 'draft',
          totalMarks: 100,
          maxFileSizeMb: 10,
          courseId: defaultCourseId ?? '',
          allowLateSubmissions: true,
          title: '',
          description: '',
          dueDate: ''
        });
      }
    }
  }, [isOpen, assignment, initialDraft, reset, defaultCourseId]);

  const handleFormSubmit = async (data: Record<string, unknown>) => {
    const typedData = data as FormData;
    setIsSubmitting(true);
    try {
      let attachmentUrl = assignment?.attachmentUrl;
      
      if (selectedFile) {
        const uploadResult = await storageService.uploadFile(selectedFile);
        attachmentUrl = uploadResult.url;
      }

      await onSubmit({ 
        ...typedData, 
        dueDate: new Date(typedData.dueDate).toISOString(), 
        totalMarks: Number(typedData.totalMarks),
        attachmentUrl
      });
      
      reset();
      setSelectedFile(null);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={assignment ? 'Edit Assignment' : title}
      size="lg"
      footer={
        <>
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSubmit(handleFormSubmit)} disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : assignment ? 'Update Assignment' : 'Create Assignment'}
          </button>
        </>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div className="form-group">
          <label className="form-label" htmlFor="assign-title">Title</label>
          <input id="assign-title" className={`input ${errors.title ? 'input-error' : ''}`} placeholder="Assignment title" {...register('title')} />
          {errors.title && <p className="form-error">{errors.title.message}</p>}
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="assign-desc">Description</label>
          <textarea id="assign-desc" rows={4} className={`input ${errors.description ? 'input-error' : ''}`}
            placeholder="Describe the assignment requirements in detail..." style={{ resize: 'vertical' }}
            {...register('description')} />
          {errors.description && <p className="form-error">{errors.description.message}</p>}
        </div>

        <div className="form-group">
          <label className="form-label">Attachment (Optional)</label>
          {assignment?.attachmentUrl && !selectedFile && (
            <div style={{ marginBottom: '0.5rem', fontSize: '0.85rem' }}>
              Current attachment: <a href={assignment.attachmentUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--color-primary)' }}>View File</a>
            </div>
          )}
          {selectedFile ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-sm)', background: 'var(--color-surface-2)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
                <Paperclip size={14} />
                <span>{selectedFile.name}</span>
              </div>
              <button type="button" className="btn btn-ghost btn-icon btn-sm" onClick={() => setSelectedFile(null)}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <input type="file" className="input" onChange={e => {
              if (e.target.files && e.target.files.length > 0) setSelectedFile(e.target.files[0]);
            }} />
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group">
            <label className="form-label" htmlFor="assign-course">Course</label>
            <select id="assign-course" className={`input ${errors.courseId ? 'input-error' : ''}`} {...register('courseId')}>
              <option value="">Select a course</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.title} ({c.code})</option>)}
            </select>
            {errors.courseId && <p className="form-error">{errors.courseId.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="assign-status">Status</label>
            <select id="assign-status" className="input" {...register('status')}>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem' }}>
          <div className="form-group" style={{ gridColumn: 'span 2' }}>
            <label className="form-label" htmlFor="assign-due">Due Date & Time</label>
            <input id="assign-due" type="datetime-local" className={`input ${errors.dueDate ? 'input-error' : ''}`} {...register('dueDate')} />
            {errors.dueDate && <p className="form-error">{errors.dueDate.message}</p>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="assign-marks">Total Marks</label>
            <input id="assign-marks" type="number" min={1} className={`input ${errors.totalMarks ? 'input-error' : ''}`} {...register('totalMarks')} />
            {errors.totalMarks && <p className="form-error">{errors.totalMarks.message}</p>}
          </div>
        </div>

        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
          <input id="assign-late" type="checkbox" className="checkbox checkbox-primary" {...register('allowLateSubmissions')} />
          <label className="form-label" htmlFor="assign-late" style={{ marginBottom: 0, cursor: 'pointer' }}>
            Allow Late Submissions
          </label>
        </div>

        <div className="form-group">
          <label className="form-label" htmlFor="assign-filesize">Max File Size (MB)</label>
          <input id="assign-filesize" type="number" min={1} max={100} className="input" style={{ maxWidth: 120 }} placeholder="10" {...register('maxFileSizeMb')} />
          <p className="form-hint">Leave empty to allow any file size</p>
        </div>
      </div>
    </Modal>
  );
}
