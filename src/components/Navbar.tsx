import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { 
  Activity, 
  Users, 
  Stethoscope, 
  FileSpreadsheet, 
  ShieldCheck, 
  ShieldAlert, 
  LogOut, 
  HeartPulse,
  Menu,
  X,
  UserCog,
  Cloud,
  RefreshCw,
  Wifi,
  WifiOff
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const { 
    currentUser, 
    setCurrentUser, 
    users,
    privacyMask, 
    setPrivacyMask, 
    activeTab, 
    setActiveTab,
    setLoginModalOpen,
    showToast,
    cloudSyncStatus,
    lastSyncedAt,
    syncNow
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isDoctor = currentUser.role === 'doctor' || currentUser.role === 'head_doctor';
  const isAdmin = currentUser.role === 'admin';

  const handleQuickSwitchUser = (userId: string) => {
    const selected = users.find(u => u.id === userId);
    if (selected) {
      setCurrentUser(selected);
      showToast(`Đã chuyển vai làm việc: ${selected.title} ${selected.name} (${selected.role === 'admin' ? 'Quản trị viên' : selected.role === 'nurse' ? 'Điều dưỡng' : 'Bác sĩ'})`, 'info');
    }
  };

  const navItems = [
    { id: 'dashboard' as const, label: 'Tổng quan', icon: Activity },
    { id: 'patients' as const, label: 'DS Bệnh nhân', icon: Users },
    { id: 'ward_round' as const, label: 'Đi buồng', icon: Stethoscope, highlight: true },
    { id: 'reports' as const, label: 'Báo cáo & XN', icon: FileSpreadsheet },
    { id: 'admin' as const, label: 'Quản trị hệ thống', icon: ShieldCheck },
  ];

  const handleTabClick = (tabId: typeof activeTab) => {
    setActiveTab(tabId);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header className="no-print sticky top-0 z-40 bg-white border-b border-slate-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-2 sm:gap-4 h-16">
            
            {/* Zone 1: Single-line Hospital & Department Brand */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-sky-600 flex items-center justify-center text-white shadow-xs">
                <HeartPulse className="w-5 h-5 sm:w-6 sm:h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="text-sm sm:text-base font-bold tracking-tight text-slate-900 whitespace-nowrap">
                    BVĐK TP QUẢNG NINH
                  </span>
                  <span className="hidden sm:inline text-[11px] font-semibold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                    Khoa Rối loạn nhịp tim
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 hidden md:block">
                  Hệ thống Quản lý Bệnh nhân & Trợ lý Đi buồng Lâm sàng
                </p>
              </div>
            </div>

            {/* Zone 2: Primary Navigation Tabs (Desktop / Tablet >= md) */}
            <nav className="hidden md:flex items-center gap-1 lg:gap-2">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs lg:text-sm font-semibold rounded-lg transition-all whitespace-nowrap min-h-[40px] ${
                      isActive
                        ? item.id === 'ward_round'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : item.id === 'admin'
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'bg-slate-900 text-white shadow-xs'
                        : item.id === 'admin'
                        ? 'text-purple-700 hover:text-purple-900 hover:bg-purple-50 font-bold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Zone 3: Security, Cloud Sync & Role Switch Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
              {/* Cloud Database Sync Status Indicator */}
              <button
                type="button"
                onClick={() => syncNow()}
                title={
                  cloudSyncStatus === 'connected'
                    ? `Đang đồng bộ trực tuyến thời gian thực với Cloud Firestore. Lần đồng bộ gần nhất: ${lastSyncedAt || 'Vừa xong'}. Bấm để đồng bộ ngay.`
                    : cloudSyncStatus === 'syncing'
                    ? 'Đang gửi và đồng bộ dữ liệu lên máy chủ đám mây...'
                    : 'Mất kết nối đám mây tạm thời. Bấm để thử kết nối lại.'
                }
                className={`flex items-center justify-center gap-1.5 px-2.5 py-2 min-h-[44px] text-xs font-semibold rounded-lg border transition-all whitespace-nowrap shadow-2xs ${
                  cloudSyncStatus === 'connected'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                    : cloudSyncStatus === 'syncing'
                    ? 'bg-sky-50 text-sky-800 border-sky-300'
                    : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                }`}
              >
                {cloudSyncStatus === 'connected' ? (
                  <>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <Cloud className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="hidden sm:inline">Cloud Online</span>
                  </>
                ) : cloudSyncStatus === 'syncing' ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 text-sky-600 animate-spin" />
                    <span className="hidden sm:inline">Đang đồng bộ...</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3.5 h-3.5 text-rose-600" />
                    <span className="hidden sm:inline">Ngoại tuyến</span>
                  </>
                )}
              </button>

              {/* Privacy Mask Toggle */}
              <button
                onClick={() => setPrivacyMask(prev => !prev)}
                title={privacyMask ? "Đang bật Bảo mật thông tin (Ẩn tên & CCCD)" : "Bật Chế độ Bảo mật khi giao ban/chiếu màn hình"}
                className={`flex items-center justify-center gap-1.5 px-2.5 py-2 min-h-[44px] text-xs font-semibold rounded-lg border transition-all whitespace-nowrap ${
                  privacyMask 
                    ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-xs ring-1 ring-amber-300' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {privacyMask ? (
                  <>
                    <ShieldCheck className="w-4 h-4 text-amber-600" />
                    <span className="hidden lg:inline">Bảo mật: BẬT</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="w-4 h-4 text-slate-400" />
                    <span className="hidden lg:inline">Bảo mật</span>
                  </>
                )}
              </button>

              {/* User Profile & Role Switcher */}
              <div className="flex items-center gap-1.5 sm:gap-2 pl-1 sm:pl-2 border-l border-slate-200">
                <div className="text-right hidden xl:block">
                  <div className="text-xs font-bold text-slate-800 leading-tight">
                    {currentUser.title} {currentUser.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">
                    {isAdmin ? 'Quản trị viên hệ thống' : isDoctor ? 'Bác sĩ điều trị' : 'Điều dưỡng viên'}
                  </div>
                </div>

                {/* Quick switch selector for on-duty staff */}
                <select
                  value={currentUser.id}
                  onChange={(e) => handleQuickSwitchUser(e.target.value)}
                  className="text-xs bg-slate-100 border border-slate-300 rounded-lg py-2 px-2 text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 min-h-[44px] max-w-[130px] sm:max-w-[180px] truncate"
                  title="Đổi tài khoản kíp trực"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.title} {u.name} ({u.role === 'admin' ? 'Admin' : u.role === 'nurse' ? 'ĐD' : 'BS'})
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => setLoginModalOpen(true)}
                  title="Đăng xuất / Khóa phiên"
                  className="p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>

                {/* Mobile Hamburger Toggle for drawer */}
                <button
                  onClick={() => setMobileMenuOpen(prev => !prev)}
                  className="md:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
                  aria-label="Menu"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* Mobile Dropdown Drawer Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 shadow-lg animate-in slide-in-from-top-2 duration-200">
            <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
              Điều hướng chuyên môn
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(item.id)}
                    className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all min-h-[48px] w-full text-left ${
                      isActive
                        ? item.id === 'ward_round'
                          ? 'bg-sky-600 text-white shadow-xs'
                          : item.id === 'admin'
                          ? 'bg-purple-700 text-white shadow-xs'
                          : 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-5 h-5 shrink-0" />
                    <span>{item.label}</span>
                    {item.id === 'admin' && (
                      <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-bold">
                        Bảo mật
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-3 pt-3 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600">
              <div className="flex items-center gap-2">
                <UserCog className="w-4 h-4 text-slate-500" />
                <span className="font-semibold">{currentUser.title} {currentUser.name}</span>
              </div>
              <span className="font-bold text-sky-700">
                {currentUser.role === 'admin' ? 'Quản trị viên' : currentUser.role === 'nurse' ? 'Điều dưỡng' : 'Bác sĩ'}
              </span>
            </div>
          </div>
        )}
      </header>

      {/* Fixed Bottom Navigation Bar for Mobile (< md) - Ergonomic Thumb Access */}
      <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1 shadow-lg flex items-center justify-around safe-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          const isHighlight = item.id === 'ward_round';
          
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center justify-center py-1.5 px-2 rounded-xl transition-all min-h-[50px] flex-1 ${
                isActive
                  ? isHighlight
                    ? 'text-sky-600 font-bold'
                    : item.id === 'admin'
                    ? 'text-purple-700 font-bold'
                    : 'text-slate-900 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className={`p-1 rounded-lg ${isActive ? (isHighlight ? 'bg-sky-50' : item.id === 'admin' ? 'bg-purple-50' : 'bg-slate-100') : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? (isHighlight ? 'text-sky-600' : item.id === 'admin' ? 'text-purple-700' : 'text-slate-900') : 'text-slate-500'}`} />
              </div>
              <span className="text-[10px] leading-tight font-medium mt-0.5 truncate max-w-[62px]">
                {item.id === 'dashboard' ? 'Tổng quan' : item.id === 'patients' ? 'Bệnh nhân' : item.id === 'ward_round' ? 'Đi buồng' : item.id === 'reports' ? 'Báo cáo' : 'Quản trị'}
              </span>
            </button>
          );
        })}
      </nav>
    </>
  );
};
