import React, { useState } from 'react';
import {
  Users as UsersIcon,
  UserPlus,
  ShieldCheck,
  Eye,
  KeyRound,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  Lock,
} from 'lucide-react';
import {
  useUsers,
  useCreateUser,
  useUpdateUser,
  useResetUserPassword,
  useDeleteUser,
} from '../api/hooks';
import { useAuthStore } from '../stores/authStore';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';
import { User, UserRole } from '../types';

export const Users: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { data, isLoading } = useUsers();
  const users = data?.users || [];

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();
  const resetPasswordMutation = useResetUserPassword();
  const deleteUserMutation = useDeleteUser();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'READ_ONLY'>('ALL');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resettingUser, setResettingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // Form states
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'READ_ONLY' as 'ADMIN' | 'READ_ONLY',
    isActive: true,
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    role: 'READ_ONLY' as 'ADMIN' | 'READ_ONLY',
    isActive: true,
  });

  const [newPassword, setNewPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Filter users
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole =
      roleFilter === 'ALL' ||
      (roleFilter === 'ADMIN' && (u.role === 'ADMIN' || (u.role as string) === 'QA_LEAD')) ||
      (roleFilter === 'READ_ONLY' && (u.role === 'READ_ONLY' || (u.role as string) === 'VIEWER'));
    return matchesSearch && matchesRole;
  });

  // Top stats counters
  const totalUsers = users.length;
  const adminCount = users.filter((u) => u.role === 'ADMIN' || (u.role as string) === 'QA_LEAD').length;
  const readOnlyCount = users.filter((u) => u.role === 'READ_ONLY' || (u.role as string) === 'VIEWER').length;
  const activeCount = users.filter((u) => u.isActive !== false).length;

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    try {
      await createUserMutation.mutateAsync(createForm);
      setIsCreateOpen(false);
      setCreateForm({ name: '', email: '', password: '', role: 'READ_ONLY', isActive: true });
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to create user');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setFormError(null);
    try {
      await updateUserMutation.mutateAsync({ id: editingUser.id, data: editForm });
      setEditingUser(null);
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to update user');
    }
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resettingUser) return;
    setFormError(null);
    try {
      await resetPasswordMutation.mutateAsync({ id: resettingUser.id, newPassword });
      setResettingUser(null);
      setNewPassword('');
      alert(`Password successfully updated for ${resettingUser.email}`);
    } catch (err: any) {
      setFormError(err.response?.data?.error || 'Failed to reset password');
    }
  };

  const handleDeleteSubmit = async () => {
    if (!deletingUser) return;
    setFormError(null);
    try {
      await deleteUserMutation.mutateAsync(deletingUser.id);
      setDeletingUser(null);
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to delete user');
      setDeletingUser(null);
    }
  };

  const handleToggleActive = async (targetUser: User) => {
    try {
      await updateUserMutation.mutateAsync({
        id: targetUser.id,
        data: { isActive: !targetUser.isActive },
      });
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to update user status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <UsersIcon className="w-5 h-5 text-blue-600" />
            <span>User Management & Role-Based Access Control</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Administer dashboard access, provision Read-Only observers, and manage security credentials
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsCreateOpen(true);
          }}
          className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <UserPlus className="w-3.5 h-3.5" />
          <span>Create New User</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="card p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
            Total Users
          </span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
            {totalUsers}
          </span>
          <span className="text-[10px] text-slate-400">Registered dashboard accounts</span>
        </div>

        <div className="card p-4 border-l-4 border-blue-500">
          <span className="text-[11px] font-semibold text-blue-500 uppercase tracking-wider block">
            Administrators
          </span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
            {adminCount}
          </span>
          <span className="text-[10px] text-slate-400">Full execution & config control</span>
        </div>

        <div className="card p-4 border-l-4 border-teal-500">
          <span className="text-[11px] font-semibold text-teal-500 uppercase tracking-wider block">
            Read-Only Observers
          </span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
            {readOnlyCount}
          </span>
          <span className="text-[10px] text-slate-400">View-only analytics & reporting</span>
        </div>

        <div className="card p-4 border-l-4 border-emerald-500">
          <span className="text-[11px] font-semibold text-emerald-500 uppercase tracking-wider block">
            Active Accounts
          </span>
          <span className="text-2xl font-bold text-slate-900 dark:text-white mt-1 block">
            {activeCount}
          </span>
          <span className="text-[10px] text-slate-400">Granted login permissions</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="card p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          {(['ALL', 'ADMIN', 'READ_ONLY'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRoleFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                roleFilter === r
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {r === 'ALL' ? 'All Roles' : r === 'ADMIN' ? 'Admin' : 'Read-Only'}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      {isLoading ? (
        <LoadingSpinner text="Loading users from database..." />
      ) : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Joined Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredUsers.map((u) => {
                  const isAdmin = u.role === 'ADMIN' || (u.role as string) === 'QA_LEAD';
                  const isCurrent = currentUser?.id === u.id;

                  return (
                    <tr
                      key={u.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                              isAdmin
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                              <span>{u.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                                  You
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] text-slate-400">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        {isAdmin ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                            <ShieldCheck className="w-3 h-3 text-blue-600" />
                            <span>Administrator</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            <Eye className="w-3 h-3 text-slate-400" />
                            <span>Read-Only</span>
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleToggleActive(u)}
                          disabled={isCurrent}
                          title={isCurrent ? 'You cannot deactivate your own account' : 'Toggle status'}
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full transition-colors ${
                            u.isActive !== false
                              ? 'bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100'
                              : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 hover:bg-red-100'
                          } ${isCurrent ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                        >
                          {u.isActive !== false ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Active</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-red-500" />
                              <span>Deactivated</span>
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-3 px-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                        {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '—'}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setFormError(null);
                              setEditingUser(u);
                              setEditForm({
                                name: u.name,
                                email: u.email,
                                role: (u.role === 'ADMIN' ? 'ADMIN' : 'READ_ONLY'),
                                isActive: u.isActive !== false,
                              });
                            }}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Edit User"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => {
                              setFormError(null);
                              setResettingUser(u);
                              setNewPassword('');
                            }}
                            className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors"
                            title="Reset Password"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => setDeletingUser(u)}
                            disabled={isCurrent}
                            className={`p-1.5 rounded transition-colors ${
                              isCurrent
                                ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed'
                                : 'text-slate-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40'
                            }`}
                            title={isCurrent ? 'Cannot delete yourself' : 'Delete User'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- CREATE USER MODAL --- */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="card w-full max-w-md p-6 bg-white dark:bg-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>Create New User</span>
              </h3>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@saral.qa"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Initial Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={createForm.password}
                  onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assigned Role
                </label>
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                      createForm.role === 'READ_ONLY'
                        ? 'border-teal-500 bg-teal-50/30 dark:bg-teal-950/30'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="createRole"
                      checked={createForm.role === 'READ_ONLY'}
                      onChange={() => setCreateForm({ ...createForm, role: 'READ_ONLY' })}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">Read-Only</span>
                      <span className="text-[10px] text-slate-500">Monitor dashboards & test results</span>
                    </div>
                  </label>

                  <label
                    className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-all ${
                      createForm.role === 'ADMIN'
                        ? 'border-blue-500 bg-blue-50/30 dark:bg-blue-950/30'
                        : 'border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="createRole"
                      checked={createForm.role === 'ADMIN'}
                      onChange={() => setCreateForm({ ...createForm, role: 'ADMIN' })}
                      className="mt-0.5"
                    />
                    <div>
                      <span className="font-bold text-slate-900 dark:text-white block">Admin</span>
                      <span className="text-[10px] text-slate-500">Full execution & user control</span>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="createIsActive"
                  checked={createForm.isActive}
                  onChange={(e) => setCreateForm({ ...createForm, isActive: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <label htmlFor="createIsActive" className="font-semibold text-slate-700 dark:text-slate-300">
                  Activate account immediately
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="btn-secondary text-xs py-2 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createUserMutation.isPending}
                  className="btn-primary text-xs py-2 px-4"
                >
                  {createUserMutation.isPending ? 'Creating...' : 'Create Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT USER MODAL --- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="card w-full max-w-md p-6 bg-white dark:bg-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-blue-600" />
                <span>Edit User Details</span>
              </h3>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Role
                </label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                >
                  <option value="READ_ONLY">Read-Only (Monitoring only)</option>
                  <option value="ADMIN">Administrator (Full control)</option>
                </select>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="editIsActive"
                  checked={editForm.isActive}
                  onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <label htmlFor="editIsActive" className="font-semibold text-slate-700 dark:text-slate-300">
                  Account Active (User can log in)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="btn-secondary text-xs py-2 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updateUserMutation.isPending}
                  className="btn-primary text-xs py-2 px-4"
                >
                  {updateUserMutation.isPending ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RESET PASSWORD MODAL --- */}
      {resettingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="card w-full max-w-sm p-6 bg-white dark:bg-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Reset User Password</span>
              </h3>
              <button
                onClick={() => setResettingUser(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Set a new password for account: <strong>{resettingUser.email}</strong>
            </p>

            {formError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400">
                {formError}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  New Password
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Minimum 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setResettingUser(null)}
                  className="btn-secondary text-xs py-2 px-3"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetPasswordMutation.isPending}
                  className="btn-primary text-xs py-2 px-4 bg-amber-600 hover:bg-amber-700"
                >
                  {resetPasswordMutation.isPending ? 'Updating...' : 'Set Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE USER CONFIRMATION MODAL --- */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="card w-full max-w-sm p-6 bg-white dark:bg-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete User Account</h3>
                <p className="text-xs text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Are you sure you want to permanently delete user{' '}
              <strong className="text-slate-900 dark:text-white">{deletingUser.email}</strong>?
            </p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="btn-secondary text-xs py-2 px-3"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSubmit}
                disabled={deleteUserMutation.isPending}
                className="btn-danger text-xs py-2 px-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg"
              >
                {deleteUserMutation.isPending ? 'Deleting...' : 'Delete User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

