import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { INITIAL_USERS } from '../mockData.ts';
import { Lock, ShieldCheck, HeartPulse, User, KeyRound } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { loginModalOpen, setLoginModalOpen, login, currentUser } = useApp();
  const [selectedUsername, setSelectedUsername] = useState(currentUser.username);
  const [password, setPassword] = useState('123456');

  if (!loginModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(selectedUsername);
  };

  const handleSelectQuickUser = (username: string) => {
    setSelectedUsername(username);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-5 text-xs">
        
        {/* Brand Lockup */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-sky-600 rounded-xl mx-auto flex items-center justify-center text-white shadow-md">
            <HeartPulse className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">
              BV Đa Khoa Thành Phố Quảng Ninh
            </h2>
            <p className="text-xs text-sky-700 font-semibold">
              Khoa Rối Loạn Nhịp Tim · Đăng Nhập Ca Trực
            </p>
          </div>
        </div>

        {/* Quick User Selector Pills for Clinical Convenience */}
        <div>
          <label className="block font-semibold text-slate-700 mb-2">
            Chọn tài khoản bác sĩ / điều dưỡng ca trực:
          </label>
          <div className="grid grid-cols-2 gap-2">
            {INITIAL_USERS.map(u => (
              <button
                type="button"
                key={u.id}
                onClick={() => handleSelectQuickUser(u.username)}
                className={`p-2 rounded-lg border text-left transition-all ${
                  selectedUsername === u.username
                    ? 'border-sky-600 bg-sky-50 text-sky-900 font-semibold ring-1 ring-sky-500'
                    : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="font-bold text-[11px] truncate">{u.title} {u.name}</div>
                <div className="text-[10px] text-slate-500 font-normal">
                  {u.role === 'nurse' ? 'Điều dưỡng' : 'Bác sĩ'} · {u.username}
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-3 pt-2 border-t border-slate-100">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tên đăng nhập (Mã nhân viên bệnh viện):
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                required
                value={selectedUsername}
                onChange={(e) => setSelectedUsername(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mật khẩu tiêu chuẩn:
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
              />
            </div>
            <p className="text-[10px] text-slate-400 mt-1">Mật khẩu mẫu mặc định: 123456</p>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-lg shadow-sm transition-colors text-xs flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>Xác Thực & Đăng Nhập Ca Trực</span>
            </button>
          </div>
        </form>

        <p className="text-[10px] text-center text-slate-400">
          Hệ thống bảo mật nghiêm ngặt theo quy chế an toàn bệnh án điện tử Bộ Y Tế.
        </p>

      </div>
    </div>
  );
};
