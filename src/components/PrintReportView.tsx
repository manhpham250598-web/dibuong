import React from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Printer, X, Download, ShieldCheck } from 'lucide-react';

interface PrintReportViewProps {
  onClose: () => void;
}

export const PrintReportView: React.FC<PrintReportViewProps> = ({ onClose }) => {
  const { patients, currentUser } = useApp();

  const activePatients = patients.filter(p => p.status === 'active');
  const emergencyPatients = activePatients.filter(p => p.triageLevel === 'emergency');
  const warningPatients = activePatients.filter(p => p.triageLevel === 'warning');
  const stablePatients = activePatients.filter(p => p.triageLevel === 'stable');

  const today = new Date();
  const dateFormatted = `Ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;
  const timeFormatted = `${today.getHours().toString().padStart(2, '0')}:${today.getMinutes().toString().padStart(2, '0')}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      
      {/* Modal Dialog Container */}
      <div className="bg-white rounded-xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-4">
        
        {/* Modal Header Controls (Hidden during print) */}
        <div className="no-print bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-sky-400" />
            <span className="font-bold text-sm">Biên Bản Giao Ban Ca Trực Khoa Rối Loạn Nhịp Tim (Bản In A4)</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span>In Báo Cáo / Xuất PDF</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Document Sheet (A4 standardized) */}
        <div className="p-8 sm:p-12 text-slate-900 bg-white min-h-[800px] text-xs sm:text-sm font-sans space-y-6">
          
          {/* Header Lines */}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
            <div className="text-left space-y-0.5">
              <p className="font-bold uppercase tracking-wider text-xs">SỞ Y TẾ TỈNH QUẢNG NINH</p>
              <p className="font-bold text-xs uppercase text-slate-800">BV ĐA KHOA THÀNH PHỐ QUẢNG NINH</p>
              <p className="font-bold text-xs text-sky-800">KHOA RỐI LOẠN NHỊP TIM</p>
            </div>
            <div className="text-right space-y-0.5">
              <p className="font-bold text-xs uppercase">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
              <p className="text-xs italic underline">Độc lập - Tự do - Hạnh phúc</p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">Quảng Ninh, {dateFormatted}</p>
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-1">
            <h1 className="text-lg sm:text-xl font-bold uppercase tracking-wide text-slate-900">
              BIÊN BẢN GIAO BAN CA TRỰC NỘI TRÚ
            </h1>
            <p className="text-xs text-slate-600 italic">
              (Thời điểm bàn giao: {timeFormatted} - {dateFormatted})
            </p>
          </div>

          {/* Shift Details */}
          <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs">
            <div>
              <p><strong>Bác sĩ trưởng kíp trực:</strong> {currentUser.title} {currentUser.name}</p>
              <p className="mt-1"><strong>Bác sĩ phụ trách phòng thủ thuật:</strong> ThS. BS Nguyễn Hải Đăng</p>
            </div>
            <div>
              <p><strong>Điều dưỡng trưởng ca:</strong> CNĐD Lê Thị Thu Hà</p>
              <p className="mt-1"><strong>Điều dưỡng chăm sóc buồng cấp cứu:</strong> ĐD Trần Văn Kiên</p>
            </div>
          </div>

          {/* Part 1: Census Statistics */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-900 border-b border-slate-300 pb-1">
              I. TÌNH HÌNH BỆNH NHÂN TRONG CA TRỰC
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center font-mono">
              <div className="p-2 border border-slate-200 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 block font-sans">Tổng BN điều trị</span>
                <span className="font-bold text-base text-slate-900">{activePatients.length}</span>
              </div>
              <div className="p-2 border border-rose-200 rounded bg-rose-50/50">
                <span className="text-[10px] text-rose-700 block font-sans">Cấp cứu (Đỏ)</span>
                <span className="font-bold text-base text-rose-700">{emergencyPatients.length}</span>
              </div>
              <div className="p-2 border border-amber-200 rounded bg-amber-50/50">
                <span className="text-[10px] text-amber-700 block font-sans">Theo dõi sát</span>
                <span className="font-bold text-base text-amber-700">{warningPatients.length}</span>
              </div>
              <div className="p-2 border border-emerald-200 rounded bg-emerald-50/50">
                <span className="text-[10px] text-emerald-700 block font-sans">Ổn định</span>
                <span className="font-bold text-base text-emerald-700">{stablePatients.length}</span>
              </div>
              <div className="p-2 border border-slate-200 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 block font-sans">Giường trống</span>
                <span className="font-bold text-base text-slate-900">{40 - activePatients.length}</span>
              </div>
              <div className="p-2 border border-slate-200 rounded bg-slate-50">
                <span className="text-[10px] text-slate-500 block font-sans">Tử vong</span>
                <span className="font-bold text-base text-slate-900">0</span>
              </div>
            </div>
          </div>

          {/* Part 2: Critical Inpatients Detail */}
          <div className="space-y-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-slate-900 border-b border-slate-300 pb-1">
              II. DANH SÁCH BỆNH NHÂN NẶNG & Y LỆNH BÀN GIAO
            </h2>

            <table className="w-full text-left border-collapse border border-slate-300 text-[11px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold">
                  <th className="p-2 border-r border-slate-300 w-16">Giường</th>
                  <th className="p-2 border-r border-slate-300 w-36">Họ tên / Tuổi</th>
                  <th className="p-2 border-r border-slate-300">Chẩn đoán rối loạn nhịp</th>
                  <th className="p-2 border-r border-slate-300 w-24">Sinh hiệu</th>
                  <th className="p-2">Y lệnh & Lưu ý bàn giao cho ca sau</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {activePatients.map(p => (
                  <tr key={p.id}>
                    <td className="p-2 border-r border-slate-200 font-mono font-bold text-sky-800">
                      {p.bedNumber}
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      <strong>{p.fullName}</strong>
                      <div className="text-[10px] text-slate-500 font-mono">{p.age}t · {p.patientCode}</div>
                    </td>
                    <td className="p-2 border-r border-slate-200">
                      <div className="font-semibold">{p.arrhythmiaType}</div>
                      <div className="text-[10px] text-slate-600 line-clamp-2">{p.admissionDiagnosis}</div>
                    </td>
                    <td className="p-2 border-r border-slate-200 font-mono text-[10px]">
                      <div>HR: {p.vitals.hr} bpm</div>
                      <div>HA: {p.vitals.bp}</div>
                      <div>SpO2: {p.vitals.spo2}%</div>
                    </td>
                    <td className="p-2 text-[10px]">
                      {p.wardTasks.length > 0 ? (
                        <ul className="list-disc pl-3 space-y-0.5">
                          {p.wardTasks.slice(0, 2).map(t => (
                            <li key={t.id} className={t.done ? 'line-through text-slate-400' : 'text-slate-800'}>
                              {t.task}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <span className="text-slate-400 italic">Theo dõi monitor theo dõi nhịp</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Part 3: Signatures */}
          <div className="pt-6 grid grid-cols-3 gap-6 text-center text-xs">
            <div>
              <p className="font-bold uppercase">ĐIỀU DƯỠNG TRƯỞNG CA</p>
              <p className="italic text-[10px] text-slate-400">(Ký và ghi rõ họ tên)</p>
              <div className="h-16" />
              <p className="font-bold">CNĐD. Lê Thị Thu Hà</p>
            </div>
            <div>
              <p className="font-bold uppercase">BÁC SĨ NHẬN CA TRỰC</p>
              <p className="italic text-[10px] text-slate-400">(Ký và ghi rõ họ tên)</p>
              <div className="h-16" />
              <p className="font-bold">ThS. BS. Nguyễn Hải Đăng</p>
            </div>
            <div>
              <p className="font-bold uppercase">TRƯỞNG KÍP TRỰC BÀN GIAO</p>
              <p className="italic text-[10px] text-slate-400">(Ký và ghi rõ họ tên)</p>
              <div className="h-16" />
              <p className="font-bold">{currentUser.title} {currentUser.name}</p>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
