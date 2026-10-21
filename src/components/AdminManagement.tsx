import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { User, UserRole } from '../types.ts';
import { 
  ShieldCheck, 
  UserPlus, 
  KeyRound, 
  Lock, 
  Unlock, 
  Trash2, 
  Edit, 
  Search, 
  Users, 
  Stethoscope, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  Eye, 
  EyeOff, 
  RefreshCw,
  Phone,
  Building,
  FileBadge
} from 'lucide-react';

export const AdminManagement: React.FC = () => {
  const { users, currentUser, addUser, updateUser, deleteUser, resetUserPassword, showToast } = useApp();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [resetPassUser, setResetPassUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // New user form state
  const [newUsername, setNewUsername] = useState('');
  const [newUserPassword, setNewUserPassword] = useState('123456');
  const [newName, setNewName] = useState('');
  const [newTitle, setNewTitle] = useState('BS.');
  const [newRole, setNewRole] = useState<UserRole>('doctor');
  const [newDepartment, setNewDepartment] = useState('Khoa Rối loạn nhịp tim');
  const [newLicense, setNewLicense] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const q = search.toLowerCase().trim();
      const matchQuery = !q || 
        u.name.toLowerCase().includes(q) || 
        u.username.toLowerCase().includes(q) || 
        u.licenseNumber.toLowerCase().includes(q) ||
        u.title.toLowerCase().includes(q);
      return matchRole && matchQuery;
    });
  }, [users, roleFilter, search]);

  const stats = useMemo(() => {
    return {
      total: users.length,
      doctors: users.filter(u => u.role === 'doctor' || u.role === 'head_doctor').length,
      nurses: users.filter(u => u.role === 'nurse').length,
      admins: users.filter(u => u.role === 'admin').length,
      active: users.filter(u => u.status === 'active').length,
    };
  }, [users]);

  const handleGeneratePassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$';
    let res = '';
    for (let i = 0; i < 8; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewUserPassword(res);
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newName.trim()) {
      showToast('Vui lòng điền họ tên và tên đăng nhập.', 'error');
      return;
    }

    addUser({
      username: newUsername.trim(),
      password: newUserPassword.trim() || '123456',
      name: newName.trim(),
      title: newTitle.trim(),
      role: newRole,
      department: newDepartment.trim(),
      licenseNumber: newLicense.trim() || 'Đang cập nhật',
      phoneNumber: newPhone.trim(),
      status: 'active',
    });

    setIsAddModalOpen(false);
    // Reset form
    setNewUsername('');
    setNewUserPassword('123456');
    setNewName('');
    setNewLicense('');
    setNewPhone('');
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    updateUser(editingUser.id, editingUser);
    setEditingUser(null);
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetPassUser || !newPassword.trim()) {
      showToast('Vui lòng nhập mật khẩu mới.', 'error');
      return;
    }
    resetUserPassword(resetPassUser.id, newPassword.trim());
    setResetPassUser(null);
    setNewPassword('');
  };

  const toggleUserStatus = (user: User) => {
    if (user.id === currentUser.id) {
      showToast('Không thể tự khóa tài khoản đang đăng nhập.', 'error');
      return;
    }
    const nextStatus = user.status === 'active' ? 'locked' : 'active';
    updateUser(user.id, { status: nextStatus });
    showToast(
      nextStatus === 'locked' 
        ? `Đã tạm khóa tài khoản ${user.username}.` 
        : `Đã mở khóa tài khoản ${user.username}.`,
      nextStatus === 'locked' ? 'info' : 'success'
    );
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-800 border border-purple-200">Quản Trị Viên</span>;
      case 'head_doctor':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">Bác Sĩ Trưởng Khoa</span>;
      case 'doctor':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-800 border border-sky-200">Bác Sĩ Điều Trị</span>;
      case 'nurse':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">Điều Dưỡng Viên</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4 max-w-7xl mx-auto pb-12">
      
      {/* Top Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Quản Trị Hệ Thống & Bảo Mật Tài Khoản
              </h2>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200">
                Admin Panel
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Cấp tài khoản Bác sĩ, Điều dưỡng, quản lý mật khẩu nội bộ và phân quyền truy cập hồ sơ bệnh án
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            handleGeneratePassword();
            setIsAddModalOpen(true);
          }}
          className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors shrink-0"
        >
          <UserPlus className="w-4 h-4" />
          <span>Tạo Tài Khoản Mới</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Tổng nhân sự</span>
            <Users className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-slate-900 font-mono">
            {stats.total}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">
            {stats.active} tài khoản hoạt động
          </span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Bác sĩ điều trị</span>
            <Stethoscope className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-sky-700 font-mono">
            {stats.doctors}
          </div>
          <span className="text-[11px] text-slate-400">Ra y lệnh & ký bệnh án</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Điều dưỡng viên</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-emerald-700 font-mono">
            {stats.nurses}
          </div>
          <span className="text-[11px] text-slate-400">Thực hiện y lệnh & thuốc</span>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1 font-medium">
            <span>Quản trị viên (Admin)</span>
            <ShieldCheck className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-xl sm:text-2xl font-bold text-purple-700 font-mono">
            {stats.admins}
          </div>
          <span className="text-[11px] text-slate-400">Bảo mật & Cấp quyền</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo họ tên, tên đăng nhập, số CCHN..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white transition-all"
          />
        </div>

        {/* Role Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 text-xs">
          <button
            type="button"
            onClick={() => setRoleFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              roleFilter === 'all'
                ? 'bg-purple-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Tất cả ({users.length})
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('head_doctor')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              roleFilter === 'head_doctor'
                ? 'bg-rose-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Trưởng khoa
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('doctor')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              roleFilter === 'doctor'
                ? 'bg-sky-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Bác sĩ
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('nurse')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              roleFilter === 'nurse'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Điều dưỡng
          </button>
          <button
            type="button"
            onClick={() => setRoleFilter('admin')}
            className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap transition-colors ${
              roleFilter === 'admin'
                ? 'bg-purple-800 text-white font-bold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Admin
          </button>
        </div>
      </div>

      {/* Staff List Table (Desktop & Mobile Responsive) */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        
        {/* Desktop View Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="py-3 px-4">Nhân sự</th>
                <th className="py-3 px-4">Tài khoản & Mật khẩu</th>
                <th className="py-3 px-4">Vai trò / Phân quyền</th>
                <th className="py-3 px-4">Khoa phòng & CCHN</th>
                <th className="py-3 px-4">Trạng thái</th>
                <th className="py-3 px-4 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredUsers.map((user, idx) => (
                <tr key={`${user.id}-${idx}`} className="hover:bg-slate-50/70 transition-colors">
                  
                  {/* Staff Info */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0">
                        {user.name.split(' ').pop()?.[0] || 'U'}
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">
                          {user.title} {user.name}
                        </div>
                        {user.phoneNumber && (
                          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3" />
                            <span>{user.phoneNumber}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Username & Password */}
                  <td className="py-3 px-4">
                    <div className="font-mono font-bold text-slate-800">
                      @{user.username}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Mật khẩu: <span className="text-slate-600 font-semibold">{user.password || '••••••'}</span>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3 px-4">
                    {getRoleBadge(user.role)}
                  </td>

                  {/* Department & License */}
                  <td className="py-3 px-4">
                    <div className="text-slate-800 font-medium">{user.department}</div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      CCHN: {user.licenseNumber}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4">
                    {user.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" />
                        Hoạt động
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        <Lock className="w-3 h-3" />
                        Đang khóa
                      </span>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => {
                          setResetPassUser(user);
                          setNewPassword('');
                        }}
                        className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                        title="Đặt lại mật khẩu"
                      >
                        <KeyRound className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => setEditingUser({ ...user })}
                        className="p-1.5 text-slate-500 hover:text-sky-600 hover:bg-sky-50 rounded transition-colors"
                        title="Chỉnh sửa thông tin"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => toggleUserStatus(user)}
                        className={`p-1.5 rounded transition-colors ${
                          user.status === 'active'
                            ? 'text-slate-500 hover:text-amber-600 hover:bg-amber-50'
                            : 'text-rose-600 hover:text-emerald-600 hover:bg-emerald-50'
                        }`}
                        title={user.status === 'active' ? 'Tạm khóa tài khoản' : 'Mở khóa tài khoản'}
                      >
                        {user.status === 'active' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => deleteUser(user.id)}
                        disabled={user.id === currentUser.id}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors disabled:opacity-30"
                        title="Xóa tài khoản"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredUsers.map((user, idx) => (
            <div key={`${user.id}-${idx}`} className="p-3.5 space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-300 text-slate-800 font-bold flex items-center justify-center text-xs shrink-0">
                    {user.name.split(' ').pop()?.[0] || 'U'}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">
                      {user.title} {user.name}
                    </h3>
                    <div className="text-xs font-mono text-purple-700 font-semibold">
                      @{user.username}
                    </div>
                  </div>
                </div>
                <div>{getRoleBadge(user.role)}</div>
              </div>

              <div className="bg-slate-50 rounded-lg p-2.5 text-xs space-y-1 text-slate-600">
                <div className="flex justify-between">
                  <span className="text-slate-400">Khoa phòng:</span>
                  <span className="font-medium text-slate-800">{user.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Số CCHN:</span>
                  <span className="font-mono text-slate-800">{user.licenseNumber}</span>
                </div>
                {user.phoneNumber && (
                  <div className="flex justify-between">
                    <span className="text-slate-400">Điện thoại:</span>
                    <span className="font-mono text-slate-800">{user.phoneNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400">Mật khẩu hiện tại:</span>
                  <span className="font-mono font-bold text-slate-900">{user.password || '••••••'}</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-200">
                  <span className="text-slate-400">Trạng thái:</span>
                  <span className={user.status === 'active' ? 'text-emerald-700 font-semibold' : 'text-rose-700 font-semibold'}>
                    {user.status === 'active' ? '● Đang hoạt động' : '🔒 Đang bị khóa'}
                  </span>
                </div>
              </div>

              {/* Actions row on mobile (large tap targets) */}
              <div className="grid grid-cols-4 gap-1.5 pt-1 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setResetPassUser(user);
                    setNewPassword('');
                  }}
                  className="py-2 px-2 bg-purple-50 text-purple-800 font-medium rounded-lg text-center hover:bg-purple-100 transition-colors flex items-center justify-center gap-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Đổi MK</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEditingUser({ ...user })}
                  className="py-2 px-2 bg-sky-50 text-sky-800 font-medium rounded-lg text-center hover:bg-sky-100 transition-colors flex items-center justify-center gap-1"
                >
                  <Edit className="w-3.5 h-3.5" />
                  <span>Sửa</span>
                </button>

                <button
                  type="button"
                  onClick={() => toggleUserStatus(user)}
                  className={`py-2 px-2 font-medium rounded-lg text-center transition-colors flex items-center justify-center gap-1 ${
                    user.status === 'active' 
                      ? 'bg-amber-50 text-amber-800 hover:bg-amber-100' 
                      : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  }`}
                >
                  {user.status === 'active' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                  <span>{user.status === 'active' ? 'Khóa' : 'Mở'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => deleteUser(user.id)}
                  disabled={user.id === currentUser.id}
                  className="py-2 px-2 bg-rose-50 text-rose-700 font-medium rounded-lg text-center hover:bg-rose-100 transition-colors disabled:opacity-30 flex items-center justify-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Xóa</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="p-8 text-center text-slate-400 text-xs italic">
            Không tìm thấy tài khoản nhân viên y tế nào khớp với bộ lọc.
          </div>
        )}
      </div>

      {/* Modal: Tạo Tài Khoản Mới */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 my-6 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Tạo Tài Khoản Cán Bộ Y Tế Mới
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Cấp thông tin đăng nhập và phân quyền truy cập hồ sơ
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tên đăng nhập (Username): <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                    placeholder="vd: bs_nam, dd_huong"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-700">
                      Mật khẩu khởi tạo: <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleGeneratePassword}
                      className="text-[10px] text-purple-600 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw className="w-2.5 h-2.5" />
                      Tạo ngẫu nhiên
                    </button>
                  </div>
                  <input
                    type="text"
                    required
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    placeholder="vd: 123456"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Chức danh:
                  </label>
                  <select
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
                  >
                    <option value="BS. CKII">BS. CKII</option>
                    <option value="BS. CKI">BS. CKI</option>
                    <option value="ThS. BS">ThS. BS</option>
                    <option value="BS.">Bác sĩ</option>
                    <option value="CNĐD">Cử nhân ĐD</option>
                    <option value="ĐD">Điều dưỡng</option>
                    <option value="Quản trị viên">Quản trị viên</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Họ và tên cán bộ: <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="vd: Nguyễn Văn Nam"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Phân quyền vai trò: <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={(e: any) => setNewRole(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white font-medium"
                  >
                    <option value="doctor">Bác sĩ điều trị (Kê y lệnh & SOAPE)</option>
                    <option value="head_doctor">Bác sĩ trưởng khoa / Kíp trực</option>
                    <option value="nurse">Điều dưỡng (Thực hiện y lệnh & thuốc)</option>
                    <option value="admin">Quản trị viên (Cấp quyền & Quản lý)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số CCHN (Chứng chỉ hành nghề):
                  </label>
                  <input
                    type="text"
                    value={newLicense}
                    onChange={(e) => setNewLicense(e.target.value)}
                    placeholder="vd: 004512/QN-CCHN"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Khoa phòng:
                  </label>
                  <input
                    type="text"
                    value={newDepartment}
                    onChange={(e) => setNewDepartment(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số điện thoại liên lạc:
                  </label>
                  <input
                    type="tel"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="vd: 0912.xxx.xxx"
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="p-3 bg-purple-50 rounded-lg border border-purple-200 text-purple-900 text-[11px]">
                <strong className="block mb-0.5">Lưu ý bảo mật:</strong>
                Tài khoản mới sẽ có hiệu lực đăng nhập ngay lập tức. Cán bộ y tế chỉ được xem và xử lý các thông tin bệnh án thuộc thẩm quyền phân bổ.
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-xs transition-colors"
                >
                  Tạo Tài Khoản
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modal: Đặt Lại Mật Khẩu (Reset Password) */}
      {resetPassUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white rounded-xl max-w-sm w-full border border-slate-200 shadow-2xl p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Đặt Lại Mật Khẩu
                </h3>
              </div>
              <button 
                onClick={() => setResetPassUser(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleResetPasswordSubmit} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200 space-y-0.5">
                <div className="text-slate-500 text-[11px]">Tài khoản cán bộ:</div>
                <div className="font-bold text-slate-900">{resetPassUser.title} {resetPassUser.name}</div>
                <div className="font-mono text-purple-700 font-semibold text-[11px]">@{resetPassUser.username}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nhập mật khẩu mới:
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nhập mật khẩu mới..."
                    className="w-full p-2.5 pr-9 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-purple-500 focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetPassUser(null)}
                  className="px-3.5 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={!newPassword.trim()}
                  className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-lg shadow-xs disabled:opacity-40"
                >
                  Cập Nhật Mật Khẩu
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Modal: Chỉnh Sửa Thông Tin Cán Bộ */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-lg w-full border border-slate-200 shadow-2xl p-5 sm:p-6 space-y-4 my-6">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-sky-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Chỉnh Sửa Thông Tin Cán Bộ
                </h3>
              </div>
              <button 
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Chức danh:
                  </label>
                  <input
                    type="text"
                    value={editingUser.title}
                    onChange={(e) => setEditingUser({ ...editingUser, title: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Họ và tên:
                  </label>
                  <input
                    type="text"
                    value={editingUser.name}
                    onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Vai trò:
                  </label>
                  <select
                    value={editingUser.role}
                    onChange={(e: any) => setEditingUser({ ...editingUser, role: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="doctor">Bác sĩ điều trị</option>
                    <option value="head_doctor">Bác sĩ trưởng khoa</option>
                    <option value="nurse">Điều dưỡng</option>
                    <option value="admin">Quản trị viên</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số CCHN:
                  </label>
                  <input
                    type="text"
                    value={editingUser.licenseNumber}
                    onChange={(e) => setEditingUser({ ...editingUser, licenseNumber: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Khoa phòng:
                  </label>
                  <input
                    type="text"
                    value={editingUser.department}
                    onChange={(e) => setEditingUser({ ...editingUser, department: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Số điện thoại:
                  </label>
                  <input
                    type="text"
                    value={editingUser.phoneNumber || ''}
                    onChange={(e) => setEditingUser({ ...editingUser, phoneNumber: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-xs"
                >
                  Lưu Thay Đổi
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
