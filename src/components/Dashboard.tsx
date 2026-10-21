import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { 
  Heart, 
  AlertTriangle, 
  CheckCircle2, 
  Bed, 
  TrendingUp, 
  Stethoscope, 
  PlusCircle, 
  FileText, 
  Shield,
  Activity,
  Zap,
  ArrowRight
} from 'lucide-react';

interface DashboardProps {
  onOpenAddPatient: () => void;
  onOpenPatientDetail: (id: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onOpenAddPatient, onOpenPatientDetail }) => {
  const { 
    patients, 
    setActiveTab, 
    setSelectedPatientId, 
    setFilterTriage, 
    getDisplayPatientName,
    currentUser
  } = useApp();

  const activePatients = patients.filter(p => p.status === 'active');
  const totalBeds = 40; // Quy mô giường bệnh Khoa Rối loạn nhịp tim
  const occupiedBeds = activePatients.length;
  const occupancyRate = Math.round((occupiedBeds / totalBeds) * 100);

  const emergencyPatients = activePatients.filter(p => p.triageLevel === 'emergency');
  const warningPatients = activePatients.filter(p => p.triageLevel === 'warning');
  const stablePatients = activePatients.filter(p => p.triageLevel === 'stable');

  // Thống kê phân loại rối loạn nhịp tim
  const arrhythmiaStats = activePatients.reduce((acc, curr) => {
    acc[curr.arrhythmiaType] = (acc[curr.arrhythmiaType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Tìm các cảnh báo lâm sàng sinh hiệu nguy cấp
  const criticalAlerts: Array<{ patient: typeof activePatients[0]; reason: string; severity: 'high' | 'medium' }> = [];
  activePatients.forEach(p => {
    if (p.vitals.hr > 130) {
      criticalAlerts.push({ patient: p, reason: `Nhịp nhanh nguy hiểm: ${p.vitals.hr} bpm`, severity: 'high' });
    } else if (p.vitals.hr < 50) {
      criticalAlerts.push({ patient: p, reason: `Nhịp chậm đe dọa ngừng tim: ${p.vitals.hr} bpm`, severity: 'high' });
    }

    const bpSys = parseInt(p.vitals.bp.split('/')[0] || '120', 10);
    if (bpSys < 90) {
      criticalAlerts.push({ patient: p, reason: `Tụt huyết áp: ${p.vitals.bp} mmHg (Nguy cơ sốc tim)`, severity: 'high' });
    }

    // Check latest lab for hypokalemia (K+ < 3.5)
    const latestLab = p.labTimeline[0];
    if (latestLab && latestLab.k !== undefined && latestLab.k < 3.5) {
      criticalAlerts.push({ patient: p, reason: `Hạ Kali máu: ${latestLab.k} mmol/L (Nguy cơ xoắn đỉnh)`, severity: 'high' });
    }
  });

  const handleTriageFilterClick = (level: string) => {
    setFilterTriage(level);
    setActiveTab('patients');
  };

  const handleStartWardRound = (patientId?: string) => {
    if (patientId) {
      setSelectedPatientId(patientId);
    } else if (emergencyPatients.length > 0) {
      setSelectedPatientId(emergencyPatients[0].id);
    }
    setActiveTab('ward_round');
  };

  return (
    <div className="space-y-6">
      
      {/* Welcome Banner & Quick Action Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 tracking-wide uppercase">
            <span>Ca trực hiện hành</span>
            <span aria-hidden="true">·</span>
            <span>Khoa Rối loạn nhịp tim</span>
            <span aria-hidden="true">·</span>
            <span>BVĐK TP Quảng Ninh</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1">
            Bảng Điều Khiển Giám Sát Thời Gian Thực
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Xin chào {currentUser.title} {currentUser.name}. Hệ thống ghi nhận {activePatients.length} bệnh nhân nội trú đang điều trị.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={() => handleStartWardRound()}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Stethoscope className="w-4 h-4" />
            <span>Bắt đầu Đi buồng</span>
          </button>
          
          {(currentUser.role === 'doctor' || currentUser.role === 'head_doctor') && (
            <button
              onClick={onOpenAddPatient}
              className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-xs"
            >
              <PlusCircle className="w-4 h-4 text-sky-600" />
              <span>Tiếp nhận ca mới</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('reports')}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-xs"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>Giao ban ca trực</span>
          </button>
        </div>
      </div>

      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Metric 1: Bed Occupancy */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Công suất giường</span>
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {occupiedBeds}/{totalBeds}
            </span>
            <span className="text-xs font-semibold text-sky-700">
              ({occupancyRate}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div 
              className="bg-sky-600 h-1.5 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(occupancyRate, 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-2">
            Còn trống <strong className="text-slate-800 font-mono tabular-nums">{totalBeds - occupiedBeds}</strong> giường tiếp nhận
          </p>
        </div>

        {/* Metric 2: Emergency Triage (Red) */}
        <div 
          onClick={() => handleTriageFilterClick('emergency')}
          className="bg-white rounded-xl border border-rose-200 p-4 shadow-xs cursor-pointer hover:border-rose-400 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping inline-block" />
              Cấp cứu khẩn (Đỏ)
            </span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-rose-700 tabular-nums">
              {emergencyPatients.length}
            </span>
            <span className="text-xs text-rose-600">bệnh nhân</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 flex items-center justify-between">
            <span>Rung thất, VT, Block AV III</span>
            <ArrowRight className="w-3.5 h-3.5 text-rose-600" />
          </p>
        </div>

        {/* Metric 3: Warning Triage (Yellow) */}
        <div 
          onClick={() => handleTriageFilterClick('warning')}
          className="bg-white rounded-xl border border-amber-200 p-4 shadow-xs cursor-pointer hover:border-amber-400 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Theo dõi sát (Vàng)
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-800 tabular-nums">
              {warningPatients.length}
            </span>
            <span className="text-xs text-amber-700">bệnh nhân</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 flex items-center justify-between">
            <span>Rung nhĩ nhanh, SVT, suy tim</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-600" />
          </p>
        </div>

        {/* Metric 4: Stable Triage (Green) */}
        <div 
          onClick={() => handleTriageFilterClick('stable')}
          className="bg-white rounded-xl border border-emerald-200 p-4 shadow-xs cursor-pointer hover:border-emerald-400 hover:shadow-sm transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Ổn định (Xanh)
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700 tabular-nums">
              {stablePatients.length}
            </span>
            <span className="text-xs text-emerald-600">bệnh nhân</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-3 flex items-center justify-between">
            <span>Duy trì thuốc, chuẩn bị ra viện</span>
            <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
          </p>
        </div>

      </div>

      {/* Main Grid: Critical Alerts & Arrhythmia Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Real-time Critical Clinical Alerts */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                <h2 className="text-sm sm:text-base font-bold text-slate-900">
                  Cảnh Báo Sinh Hiệu & Xét Nghiệm Cần Xử Trí Khẩn
                </h2>
              </div>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {criticalAlerts.length} chỉ số bất thường
              </span>
            </div>

            {criticalAlerts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-2" />
                Không có bệnh nhân nào trong tình trạng báo động khẩn cấp.
              </div>
            ) : (
              <div className="space-y-2.5">
                {criticalAlerts.map((alert, idx) => (
                  <div 
                    key={idx}
                    className="p-3 rounded-lg border border-rose-100 bg-rose-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-rose-50 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-900 text-sm">
                          {getDisplayPatientName(alert.patient)}
                        </span>
                        <span className="text-xs font-mono font-medium text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200">
                          {alert.patient.bedNumber} · {alert.patient.roomNumber}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-rose-700 flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                        <span>{alert.reason}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleStartWardRound(alert.patient.id)}
                        className="px-2.5 py-1 text-xs font-semibold bg-rose-600 text-white rounded hover:bg-rose-700 transition-colors"
                      >
                        Khám ngay
                      </button>
                      <button
                        onClick={() => onOpenPatientDetail(alert.patient.id)}
                        className="px-2.5 py-1 text-xs font-medium bg-white text-slate-700 border border-slate-200 rounded hover:bg-slate-50 transition-colors"
                      >
                        Bệnh án
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Ngưỡng cảnh báo: Nhịp tim &gt; 130 hoặc &lt; 50 | Huyết áp &lt; 90 | K+ &lt; 3.5 mmol/L</span>
            <button 
              onClick={() => setActiveTab('patients')}
              className="text-sky-600 font-medium hover:underline flex items-center gap-1"
            >
              <span>Xem tất cả bệnh nhân</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right 1 Col: Arrhythmia Pathology Breakdown */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Cơ Cấu Bệnh Học Nhịp Tim
            </h2>
            <Activity className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3">
            {Object.entries(arrhythmiaStats).map(([type, count]) => {
              const pct = Math.round((count / activePatients.length) * 100);
              return (
                <div key={type} className="space-y-1">
                  <div className="flex justify-between text-xs font-medium text-slate-700">
                    <span className="truncate pr-2">{type}</span>
                    <span className="font-mono tabular-nums text-slate-900 font-semibold">{count} ca ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-sky-600 h-1.5 rounded-full" 
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
            <div className="font-semibold text-slate-800 flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-sky-600" />
              <span>Quy định can thiệp cấp cứu:</span>
            </div>
            <p>
              Tất cả ca nhịp nhanh thất (VT) và Block AV cấp III phải được theo dõi monitor liên tục 24/24 và đặt sẵn máy phá rung tự động tại buồng.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
};
