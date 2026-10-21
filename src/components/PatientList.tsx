import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Patient, TriageLevel, ArrhythmiaType } from '../types.ts';
import { 
  Search, 
  Filter, 
  PlusCircle, 
  FileSpreadsheet, 
  Stethoscope, 
  Eye, 
  Trash2, 
  LogOut, 
  RefreshCw, 
  ChevronRight,
  HeartPulse,
  AlertTriangle,
  CheckCircle2,
  Zap,
  ArrowUpDown,
  UserPlus,
  Camera,
  Sparkles
} from 'lucide-react';
import { exportPatientsToExcel } from '../utils/excelExport.ts';

interface PatientListProps {
  onOpenAddPatient: (mode?: 'manual' | 'scan') => void;
  onOpenPatientDetail: (id: string) => void;
  onOpenDischargeModal: (patient: Patient) => void;
}

export const PatientList: React.FC<PatientListProps> = ({
  onOpenAddPatient,
  onOpenPatientDetail,
  onOpenDischargeModal,
}) => {
  const { 
    patients, 
    searchQuery, 
    setSearchQuery, 
    filterTriage, 
    setFilterTriage, 
    filterArrhythmia, 
    setFilterArrhythmia,
    setSelectedPatientId,
    setActiveTab,
    getDisplayPatientName,
    currentUser,
    archiveOrDeletePatient,
    bulkDeleteDischargedPatients,
    resetToMockData
  } = useApp();

  const [statusTab, setStatusTab] = useState<'active' | 'discharged' | 'archived'>('active');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);

  const isDoctor = currentUser.role === 'doctor' || currentUser.role === 'head_doctor';

  // Instant query filtering
  const filteredPatients = useMemo(() => {
    return patients.filter(p => {
      // 1. Status filter
      if (p.status !== statusTab) return false;

      // 2. Triage filter
      if (filterTriage !== 'all' && p.triageLevel !== filterTriage) return false;

      // 3. Arrhythmia filter
      if (filterArrhythmia !== 'all' && p.arrhythmiaType !== filterArrhythmia) return false;

      // 4. Search query
      if (searchQuery.trim() !== '') {
        const query = searchQuery.toLowerCase().trim();
        const matchCode = p.patientCode.toLowerCase().includes(query);
        const matchName = p.fullName.toLowerCase().includes(query);
        const matchBed = p.bedNumber.toLowerCase().includes(query);
        const matchRoom = p.roomNumber.toLowerCase().includes(query);
        const matchDiagnosis = p.admissionDiagnosis.toLowerCase().includes(query);
        const matchDoctor = p.attendingDoctor.toLowerCase().includes(query);
        const matchArrhythmia = p.arrhythmiaType.toLowerCase().includes(query);
        return matchCode || matchName || matchBed || matchRoom || matchDiagnosis || matchDoctor || matchArrhythmia;
      }

      return true;
    });
  }, [patients, statusTab, filterTriage, filterArrhythmia, searchQuery]);

  const handleGoToWardRound = (patientId: string) => {
    setSelectedPatientId(patientId);
    setActiveTab('ward_round');
  };

  const handleExportExcel = () => {
    exportPatientsToExcel(filteredPatients, `DS_BenhNhan_${statusTab}_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const handleConfirmDelete = (patientId: string) => {
    archiveOrDeletePatient(patientId, true);
    setDeleteConfirmId(null);
  };

  return (
    <div className="space-y-4">
      
      {/* Top Controls: Status Tabs & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        
        {/* Status segmented controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0 overflow-x-auto">
          <button
            onClick={() => setStatusTab('active')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              statusTab === 'active'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đang điều trị ({patients.filter(p => p.status === 'active').length})
          </button>
          <button
            onClick={() => setStatusTab('discharged')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              statusTab === 'discharged'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Đã xuất viện ({patients.filter(p => p.status === 'discharged').length})
          </button>
          <button
            onClick={() => setStatusTab('archived')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              statusTab === 'archived'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Kho lưu trữ ({patients.filter(p => p.status === 'archived').length})
          </button>
        </div>

        {/* Action Buttons: Export Excel + Dual Reception Buttons (Manual vs Scan) */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs min-h-[40px]"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel ({filteredPatients.length})</span>
          </button>

          {isDoctor && (
            <div className="inline-flex rounded-lg shadow-xs overflow-hidden border border-sky-600">
              <button
                type="button"
                onClick={() => onOpenAddPatient('manual')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 transition-colors min-h-[40px]"
                title="Bổ sung ca bệnh mới bằng cách nhập trực tiếp vào biểu mẫu"
              >
                <UserPlus className="w-4 h-4" />
                <span>Nhập trực tiếp</span>
              </button>
              <button
                type="button"
                onClick={() => onOpenAddPatient('scan')}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-sky-900 bg-sky-100 hover:bg-sky-200 border-l border-sky-500 transition-colors min-h-[40px]"
                title="Bổ sung ca bệnh mới bằng trích xuất từ ảnh chụp phiếu điều trị"
              >
                <Camera className="w-4 h-4 text-sky-700" />
                <span>Quét phiếu điều trị</span>
              </button>
            </div>
          )}

          <button
            onClick={resetToMockData}
            title="Khôi phục dữ liệu mẫu ban đầu của khoa"
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors min-h-[40px] flex items-center justify-center"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Storage Cleanup Banner for Discharged Patients */}
      {statusTab === 'discharged' && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-bold text-slate-900 text-sm">Quản lý bộ nhớ ca bệnh đã xuất viện</h4>
              <p className="text-slate-600 text-xs">
                Hiện có <strong className="text-amber-800">{patients.filter(p => p.status === 'discharged').length} ca bệnh nhân</strong> đã ra viện đang lưu trữ. Bạn có thể xóa từng ca hoặc dọn dẹp hàng loạt để tiết kiệm bộ nhớ hệ thống.
              </p>
            </div>
          </div>
          {isDoctor && patients.filter(p => p.status === 'discharged').length > 0 && (
            <button
              type="button"
              onClick={() => setIsBulkDeleteModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors shrink-0 min-h-[44px]"
            >
              <Trash2 className="w-4 h-4" />
              <span>Dọn dẹp tất cả ca đã ra viện ({patients.filter(p => p.status === 'discharged').length})</span>
            </button>
          )}
        </div>
      )}

      {/* Filter and Instant Search Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col md:flex-row md:items-center gap-3">
        
        {/* Search input (<50ms response) */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tra cứu tức thì theo Mã bệnh án, Họ tên, Giường, Buồng, Chẩn đoán..."
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
            >
              Xóa
            </button>
          )}
        </div>

        {/* Triage filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Triage:</span>
          <select
            value={filterTriage}
            onChange={(e) => setFilterTriage(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 px-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
          >
            <option value="all">Tất cả mức độ</option>
            <option value="emergency">🔴 Cấp cứu (Đỏ)</option>
            <option value="warning">🟡 Theo dõi sát (Vàng)</option>
            <option value="stable">🟢 Ổn định (Xanh)</option>
          </select>
        </div>

        {/* Arrhythmia type filter */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">Bệnh học:</span>
          <select
            value={filterArrhythmia}
            onChange={(e) => setFilterArrhythmia(e.target.value)}
            className="text-xs bg-slate-50 border border-slate-200 rounded-lg py-2 px-2.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500 max-w-[200px] truncate"
          >
            <option value="all">Tất cả rối loạn nhịp</option>
            <option value="Rung nhĩ (AFib)">Rung nhĩ (AFib)</option>
            <option value="Cuồng nhĩ (AFlut)">Cuồng nhĩ (AFlut)</option>
            <option value="Nhịp nhanh thất (VT)">Nhịp nhanh thất (VT)</option>
            <option value="Block nhĩ thất độ III (Complete AV Block)">Block nhĩ thất độ III</option>
            <option value="Cơn nhịp nhanh kịch phát trên thất (SVT)">Cơn nhịp nhanh SVT</option>
            <option value="Hội chứng Brugada">Hội chứng Brugada</option>
            <option value="Ngoại tâm thu thất (PVC/Lown IV)">Ngoại tâm thu thất</option>
            <option value="Sau cấy Máy tạo nhịp / ICD">Sau cấy máy tạo nhịp/ICD</option>
          </select>
        </div>

      </div>

      {/* Patients Data Table (Desktop / Tablet) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <th className="py-3 px-3 w-16">Giường</th>
                <th className="py-3 px-3">Bệnh Nhân / Mã BA</th>
                <th className="py-3 px-3">Triage</th>
                <th className="py-3 px-4">Chẩn Đoán Rối Loạn Nhịp</th>
                <th className="py-3 px-3 text-right">Sinh Hiệu</th>
                <th className="py-3 px-3">Bác Sĩ / ĐD</th>
                <th className="py-3 px-3 text-right w-44">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPatients.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <p className="text-sm font-medium">Không tìm thấy bệnh nhân phù hợp với bộ lọc.</p>
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setFilterTriage('all');
                        setFilterArrhythmia('all');
                      }}
                      className="mt-2 text-xs text-sky-600 font-semibold hover:underline"
                    >
                      Xóa tất cả bộ lọc
                    </button>
                  </td>
                </tr>
              ) : (
                filteredPatients.map((patient) => {
                  return (
                    <tr 
                      key={patient.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      {/* Bed & Room */}
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 tabular-nums">
                        <div className="text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 inline-block">
                          {patient.bedNumber}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans mt-0.5 truncate max-w-[100px]">
                          {patient.roomNumber}
                        </div>
                      </td>

                      {/* Patient Name & Code */}
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          <span>{getDisplayPatientName(patient)}</span>
                          <span className="text-slate-400 font-normal">
                            ({patient.age}t · {patient.gender})
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-500 tabular-nums flex items-center gap-2 mt-0.5">
                          <span>{patient.patientCode}</span>
                          <span aria-hidden="true">·</span>
                          <span>Vào: {patient.admissionDate}</span>
                        </div>
                      </td>

                      {/* Triage Level */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        {patient.triageLevel === 'emergency' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded">
                            <Zap className="w-3 h-3 text-rose-600" />
                            Cấp cứu
                          </span>
                        )}
                        {patient.triageLevel === 'warning' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3 text-amber-600" />
                            Theo dõi sát
                          </span>
                        )}
                        {patient.triageLevel === 'stable' && (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Ổn định
                          </span>
                        )}
                      </td>

                      {/* Diagnosis & Arrhythmia */}
                      <td className="py-3 px-4 max-w-xs">
                        <div className="font-semibold text-slate-800 line-clamp-1">
                          {patient.arrhythmiaType}
                        </div>
                        <div className="text-slate-500 text-[11px] line-clamp-1 mt-0.5">
                          {patient.admissionDiagnosis}
                        </div>
                        {patient.pacemakerStatus && patient.pacemakerStatus !== 'Chưa có' && (
                          <div className="text-[10px] text-sky-700 font-medium mt-0.5">
                            ⚙ {patient.pacemakerStatus}
                          </div>
                        )}
                      </td>

                      {/* Vitals */}
                      <td className="py-3 px-3 text-right font-mono tabular-nums">
                        <div className={`font-bold ${patient.vitals.hr > 120 || patient.vitals.hr < 50 ? 'text-rose-600' : 'text-slate-900'}`}>
                          {patient.vitals.hr} <span className="text-[10px] font-normal text-slate-500">bpm</span>
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {patient.vitals.bp} <span className="text-[9px]">mmHg</span>
                        </div>
                      </td>

                      {/* Attending Staff */}
                      <td className="py-3 px-3 text-slate-600 text-[11px]">
                        <div className="font-medium text-slate-800 truncate max-w-[130px]">
                          {patient.attendingDoctor}
                        </div>
                        <div className="text-slate-500 truncate max-w-[130px]">
                          {patient.primaryNurse}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          {patient.status === 'active' && (
                            <button
                              onClick={() => handleGoToWardRound(patient.id)}
                              title="Đi buồng & Ghi SOAPE"
                              className="px-2 py-1 text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-600 hover:text-white rounded border border-sky-200 transition-colors flex items-center gap-1"
                            >
                              <Stethoscope className="w-3.5 h-3.5" />
                              <span className="hidden xl:inline">Đi buồng</span>
                            </button>
                          )}

                          <button
                            onClick={() => onOpenPatientDetail(patient.id)}
                            title="Xem chi tiết hồ sơ bệnh án"
                            className="p-1 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {patient.status === 'active' && isDoctor && (
                            <button
                              onClick={() => onOpenDischargeModal(patient)}
                              title="Làm thủ tục xuất viện"
                              className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded border border-amber-200 transition-colors"
                            >
                              <LogOut className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isDoctor && (
                            <button
                              onClick={() => setDeleteConfirmId(patient.id)}
                              title="Xóa hồ sơ cũ để giải phóng tài nguyên"
                              className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded border border-rose-200 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Responsive Cards (< md) - Ergonomic Thumb Access, No Zoom Needed */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredPatients.length === 0 ? (
            <div className="py-12 px-4 text-center text-slate-500">
              <p className="text-sm font-medium">Không tìm thấy bệnh nhân phù hợp với bộ lọc.</p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterTriage('all');
                  setFilterArrhythmia('all');
                }}
                className="mt-2 text-xs text-sky-600 font-semibold hover:underline"
              >
                Xóa tất cả bộ lọc
              </button>
            </div>
          ) : (
            filteredPatients.map((patient) => {
              return (
                <div 
                  key={`m-${patient.id}`}
                  className="p-3.5 space-y-3 bg-white hover:bg-slate-50/70 transition-colors"
                >
                  {/* Card Header: Bed + Triage + Patient Name */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-mono font-bold text-sm shadow-2xs shrink-0 ${
                        patient.triageLevel === 'emergency'
                          ? 'bg-rose-600 text-white'
                          : patient.triageLevel === 'warning'
                          ? 'bg-amber-500 text-white'
                          : 'bg-emerald-600 text-white'
                      }`}>
                        {patient.bedNumber}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base leading-tight">
                          {getDisplayPatientName(patient)}
                        </h4>
                        <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-slate-700">{patient.age}t · {patient.gender}</span>
                          <span>·</span>
                          <span className="text-sky-700 bg-sky-50 px-1 rounded text-[11px] font-semibold">
                            {patient.patientCode}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {patient.triageLevel === 'emergency' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-1 rounded-md">
                          <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                          Cấp cứu
                        </span>
                      )}
                      {patient.triageLevel === 'warning' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-1 rounded-md">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                          Cảnh báo
                        </span>
                      )}
                      {patient.triageLevel === 'stable' && (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-1 rounded-md">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Ổn định
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Diagnosis & Arrhythmia Information */}
                  <div className="bg-slate-50 rounded-xl p-2.5 text-xs space-y-1.5 border border-slate-100">
                    <div className="font-semibold text-slate-800 text-sm flex items-center gap-1.5 text-sky-900">
                      <HeartPulse className="w-4 h-4 text-rose-500 shrink-0" />
                      <span>{patient.arrhythmiaType}</span>
                    </div>
                    <p className="text-slate-600 text-xs leading-relaxed line-clamp-2">
                      {patient.admissionDiagnosis}
                    </p>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <span>Buồng: <strong className="text-slate-700">{patient.roomNumber}</strong></span>
                      {patient.medicalRecordCode && (
                        <span>Số BA: <strong className="font-mono text-purple-700">{patient.medicalRecordCode}</strong></span>
                      )}
                    </div>
                  </div>

                  {/* Vitals Summary Pill on Mobile */}
                  <div className="grid grid-cols-3 gap-2 py-1.5 px-3 bg-sky-50/50 rounded-xl border border-sky-100 text-center font-mono">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">MẠCH</span>
                      <span className={`font-bold text-sm ${patient.vitals.hr > 120 || patient.vitals.hr < 50 ? 'text-rose-600' : 'text-slate-800'}`}>
                        {patient.vitals.hr} <span className="text-[9px] font-normal text-slate-500">bpm</span>
                      </span>
                    </div>
                    <div className="border-x border-sky-200">
                      <span className="text-[10px] text-slate-400 block font-sans">HUYẾT ÁP</span>
                      <span className="font-bold text-sm text-slate-800">
                        {patient.vitals.bp}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block font-sans">SpO2</span>
                      <span className="font-bold text-sm text-slate-800">
                        {patient.vitals.spo2}%
                      </span>
                    </div>
                  </div>

                  {/* Touch Action Buttons (>= 44px height for thumbs) */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {patient.status === 'active' && (
                      <button
                        type="button"
                        onClick={() => handleGoToWardRound(patient.id)}
                        className="flex items-center justify-center gap-2 py-2.5 px-3 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition-colors min-h-[44px]"
                      >
                        <Stethoscope className="w-4 h-4" />
                        <span>Đi Buồng (SOAPE)</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onOpenPatientDetail(patient.id)}
                      className={`flex items-center justify-center gap-1.5 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded-xl text-xs sm:text-sm transition-colors min-h-[44px] ${
                        patient.status !== 'active' ? 'col-span-2' : ''
                      }`}
                    >
                      <Eye className="w-4 h-4 text-slate-500" />
                      <span>Xem Hồ Sơ Chi Tiết</span>
                    </button>

                    {/* Discharged Patient Delete Button on Mobile */}
                    {patient.status === 'discharged' && isDoctor && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmId(patient.id)}
                        className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded-xl text-xs border border-rose-200 transition-colors min-h-[44px] col-span-2"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>Xóa vĩnh viễn hồ sơ này để giải phóng bộ nhớ</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Table Footer */}
        <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Hiển thị <strong>{filteredPatients.length}</strong> / <strong>{patients.length}</strong> bệnh nhân
          </span>
          <span className="text-[11px]">
            Hệ thống tối ưu hóa tốc độ truy vấn &lt; 50ms theo tiêu chuẩn tra cứu bệnh án điện tử
          </span>
        </div>
      </div>

      {/* Single Patient Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 border border-slate-200 shadow-xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">Xác Nhận Xóa Bệnh Án</h3>
                <p className="text-xs text-slate-500">Tiết kiệm tài nguyên và dung lượng lưu trữ hệ thống</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa bệnh án này không? Thao tác này sẽ giải phóng dữ liệu bộ nhớ máy chủ. Nếu bệnh nhân đã ra viện, bạn cũng có thể chọn chuyển vào <strong>Kho lưu trữ</strong> thay vì xóa vĩnh viễn.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors min-h-[40px]"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  archiveOrDeletePatient(deleteConfirmId, false);
                  setDeleteConfirmId(null);
                }}
                className="px-3 py-1.5 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg border border-amber-200 transition-colors min-h-[40px]"
              >
                Chuyển vào Kho lưu trữ
              </button>
              <button
                onClick={() => handleConfirmDelete(deleteConfirmId)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs min-h-[40px]"
              >
                Xóa vĩnh viễn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete All Discharged Patients Modal */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base sm:text-lg">Dọn Dẹp Tất Cả Ca Đã Xuất Viện</h3>
                <p className="text-xs text-rose-600 font-semibold">Giải phóng triệt để bộ nhớ máy chủ & trình duyệt</p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-xs text-rose-900 space-y-1.5">
              <div className="font-bold">⚠️ Cảnh báo thao tác xóa vĩnh viễn:</div>
              <p className="text-[11px] leading-relaxed">
                Hệ thống sẽ xóa hoàn toàn <strong>{patients.filter(p => p.status === 'discharged').length} ca bệnh nhân</strong> đã ra viện cùng toàn bộ:
              </p>
              <ul className="list-disc list-inside text-[11px] text-rose-800 space-y-0.5 pl-1">
                <li>Nhật ký diễn tiến điều trị & phiếu SOAPE</li>
                <li>Kết quả xét nghiệm & điện tâm đồ</li>
                <li>Danh sách y lệnh / checklist điều dưỡng</li>
                <li>Ảnh chụp phiếu theo dõi điều trị đính kèm</li>
              </ul>
              <p className="text-[11px] font-semibold text-rose-700 pt-1">
                Hành động này không thể hoàn tác sau khi xác nhận.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors min-h-[44px]"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={() => {
                  bulkDeleteDischargedPatients();
                  setIsBulkDeleteModalOpen(false);
                }}
                className="px-4 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-colors shadow-xs min-h-[44px] flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Xác nhận xóa sạch {patients.filter(p => p.status === 'discharged').length} ca</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
