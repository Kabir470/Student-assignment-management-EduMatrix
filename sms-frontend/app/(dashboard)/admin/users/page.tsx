'use client';

import { useEffect, useState } from 'react';
import { Plus, Search, Edit2, Trash2, ToggleLeft, ToggleRight, Hash } from 'lucide-react';
import { RequireRole } from '@/lib/auth/guards';
import PageHeader from '@/components/layout/PageHeader';
import { RoleBadge } from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { usersService } from '@/lib/api/users';
import type { User, UserRole } from '@/lib/types';
import { formatDate, getInitials } from '@/lib/utils';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const userSchema = z.object({
  firstName: z.string().min(2, 'Required'),
  lastName: z.string().min(2, 'Required'),
  email: z.string().email('Invalid email'),
  role: z.enum(['admin', 'teacher', 'student']),
  isActive: z.boolean(),
  institutionalId: z.string().optional(),
  password: z.string().min(6, 'Min 6 characters').optional().or(z.literal('')),
});
type UserFormData = z.infer<typeof userSchema>;

const ROLE_COLORS: Record<UserRole, string> = {
  admin: 'var(--color-purple)', teacher: 'var(--color-info)', student: 'var(--color-success)',
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<User | null>(null);
  const [isFetchingId, setIsFetchingId] = useState(false);

  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: { isActive: true, role: 'student', institutionalId: '' },
  });

  const selectedRole = watch('role');

  useEffect(() => {
    if (isModalOpen && !editUser) {
      setIsFetchingId(true);
      usersService.getNextId(selectedRole).then(res => {
        setValue('institutionalId', res.nextId);
      }).finally(() => {
        setIsFetchingId(false);
      });
    }
  }, [selectedRole, isModalOpen, editUser, setValue]);

  const loadUsers = async () => {
    setIsLoading(true);
      const res = await usersService.getAll({
        search, 
        role: roleFilter === 'all' ? undefined : roleFilter
      });
      setUsers(res.data);
      setTotal(res.totalCount);
    setIsLoading(false);
  };

  useEffect(() => { loadUsers(); }, [search, roleFilter]);

  const openCreate = () => { 
    setEditUser(null); 
    reset({ isActive: true, role: 'student', password: '', institutionalId: '' }); 
    setIsModalOpen(true); 
  };
  
  const openEdit = (u: User) => {
    setEditUser(u);
    setValue('firstName', u.firstName); 
    setValue('lastName', u.lastName);
    setValue('email', u.email); 
    setValue('role', u.role); 
    setValue('isActive', u.isActive);
    setValue('institutionalId', u.institutionalId || '');
    setValue('password', '');
    setIsModalOpen(true);
  };

  const onSubmit = async (data: UserFormData) => {
    if (editUser) {
      await usersService.update(editUser.id, { 
        firstName: data.firstName, 
        lastName: data.lastName, 
        email: data.email, 
        isActive: data.isActive,
        institutionalId: data.institutionalId
      });
    } else {
      await usersService.create({ 
        ...data, 
        password: data.password ?? 'default123',
        institutionalId: data.institutionalId
      });
    }
    setIsModalOpen(false);
    loadUsers();
  };

  const handleToggleActive = async (u: User) => {
    await usersService.toggleActive(u.id);
    loadUsers();
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    await usersService.delete(deleteConfirm.id);
    setDeleteConfirm(null);
    loadUsers();
  };

  return (
    <RequireRole roles={['admin']}>
      <div className="animate-fade-in">
        <PageHeader
          title="User Management"
          subtitle={`${total} total users registered`}
          breadcrumbs={[{ label: 'Admin', href: '/admin' }, { label: 'Users' }]}
          actions={
            <button className="btn btn-primary" onClick={openCreate} id="create-user-btn">
              <Plus size={16} /> Add User
            </button>
          }
        />

        {/* Filters */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
          <div className="input-wrapper" style={{ flex: 1, minWidth: 200 }}>
            <Search size={16} className="input-icon" />
            <input className="input" style={{ paddingLeft: '2.5rem' }} placeholder="Search users by name, email, or ID..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="input" style={{ width: 160 }} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="teacher">Teacher</option>
            <option value="student">Student</option>
          </select>
        </div>

        {/* Table */}
        <div className="table-wrapper">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Institutional ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j}><div className="skeleton" style={{ height: 16, borderRadius: 4 }} /></td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7}>
                    <div className="empty-state">
                      <p>No users found</p>
                    </div>
                  </td>
                </tr>
              ) : users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div className="avatar avatar-sm" style={{ background: `linear-gradient(135deg, ${ROLE_COLORS[u.role]}, ${ROLE_COLORS[u.role]}99)` }}>
                        {getInitials(u.firstName, u.lastName)}
                      </div>
                      <span style={{ fontWeight: 500, color: 'var(--color-text)' }}>{u.firstName} {u.lastName}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    {u.institutionalId || <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                  </td>
                  <td style={{ color: 'var(--color-text-secondary)' }}>{u.email}</td>
                  <td><RoleBadge role={u.role} /></td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-neutral'}`}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>{formatDate(u.createdAt)}</td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.35rem' }}>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => openEdit(u)} title="Edit">
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="btn btn-ghost btn-icon btn-sm"
                        onClick={() => handleToggleActive(u)}
                        title={u.isActive ? 'Deactivate' : 'Activate'}
                        style={{ color: u.isActive ? 'var(--color-warning)' : 'var(--color-success)' }}
                      >
                        {u.isActive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                      </button>
                      <button className="btn btn-ghost btn-icon btn-sm" onClick={() => setDeleteConfirm(u)} title="Delete" style={{ color: 'var(--color-danger)' }}>
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </div>

        {/* Create/Edit Modal */}
        <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editUser ? 'Edit User' : 'Add New User'}
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSubmit(onSubmit)}>
                {editUser ? 'Save Changes' : 'Create User'}
              </button>
            </>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">First Name</label>
                <input className={`input ${errors.firstName ? 'input-error' : ''}`} placeholder="John" {...register('firstName')} />
                {errors.firstName && <p className="form-error">{errors.firstName.message}</p>}
              </div>
              <div className="form-group">
                <label className="form-label">Last Name</label>
                <input className={`input ${errors.lastName ? 'input-error' : ''}`} placeholder="Doe" {...register('lastName')} />
                {errors.lastName && <p className="form-error">{errors.lastName.message}</p>}
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className={`input ${errors.email ? 'input-error' : ''}`} placeholder="user@sms.edu" {...register('email')} />
                {errors.email && <p className="form-error">{errors.email.message}</p>}
              </div>
              
              <div className="form-group">
                <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>{selectedRole === 'student' ? 'Student ID' : selectedRole === 'teacher' ? 'Faculty Code' : 'Staff ID'}</span>
                  {isFetchingId && <span style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 600 }}>Auto-generating...</span>}
                </label>
                <div className="input-wrapper">
                  <Hash size={16} className="input-icon" />
                  <input 
                    type="text" 
                    className={`input ${errors.institutionalId ? 'input-error' : ''}`} 
                    style={{ paddingLeft: '2.25rem' }} 
                    placeholder="e.g. 202600001" 
                    {...register('institutionalId')} 
                  />
                </div>
                <p className="form-hint" style={{ fontSize: '0.75rem', marginTop: '0.25rem', color: 'var(--color-text-muted)' }}>
                  You can customize this automatically generated ID.
                </p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group">
                <label className="form-label">Role</label>
                <select className="input" {...register('role')} disabled={!!editUser}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">{editUser ? 'New Password (optional)' : 'Password'}</label>
                <input type="password" className={`input ${errors.password ? 'input-error' : ''}`} placeholder={editUser ? 'Leave blank to keep' : 'Min 6 chars'} {...register('password')} />
                {errors.password && <p className="form-error">{errors.password.message}</p>}
              </div>
            </div>
            {editUser && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <input type="checkbox" id="user-active" {...register('isActive')} />
                <label htmlFor="user-active" className="form-label" style={{ marginBottom: 0 }}>Active Account</label>
              </div>
            )}
          </div>
        </Modal>

        {/* Delete Confirm */}
        <Modal isOpen={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Confirm Delete" size="sm"
          footer={
            <>
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDelete}>Delete User</button>
            </>
          }
        >
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Are you sure you want to delete <strong style={{ color: 'var(--color-text)' }}>{deleteConfirm?.firstName} {deleteConfirm?.lastName}</strong>? This action cannot be undone.
          </p>
        </Modal>
      </div>
    </RequireRole>
  );
}
