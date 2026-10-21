import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Patient } from '../types.ts';
import { X, LogOut, CheckCircle2, AlertTriangle } from 'lucide-react';

interface DischargeModalProps {
  patient: Patient;
  onClose: () => void;
}

export const DischargeModal: React.FC<DischargeModalProps> = ({ patient, onClose }) => {
  const { dischargePatient, getDisplayPatientName } = useApp();
  const [summary, setSummary] = useState(
    `Bệnh nhân ổn định, cắt cơn loạn nhịp hoàn toàn, sinh hiệu tốt. Kê đơn ngoại trú 14 ngày và hẹn tái khám.`
  );

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    dischargePatient(patient.id, summary);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-xs">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <LogOut className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Thủ Tục Cho Người Bệnh Ra Viện</h3>
              <p className="text-[11px] text-slate-500 font-mono">{patient.bedNumber} · {getDisplayPatientName(patient)}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleConfirm} className="space-y-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Tóm tắt bệnh án xuất viện & Y lệnh dặn dò (*):
            </label>
            <textarea
              rows={4}
              required
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-[11px] flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              Sau khi xác nhận xuất viện, giường bệnh <strong>{patient.bedNumber}</strong> sẽ được đánh dấu còn trống để tiếp nhận ca cấp cứu mới. Hồ sơ được lưu trữ trong danh sách "Đã xuất viện".
            </span>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shadow-xs"
            >
              Ký Phê Duyệt Xuất Viện
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
