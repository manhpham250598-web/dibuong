import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Patient, MedicalFile } from '../types.ts';
import { LabSummaryTable } from './LabSummaryTable.tsx';
import { 
  X, 
  Stethoscope, 
  Activity, 
  FileText, 
  Pill, 
  Clock, 
  FileImage, 
  AlertTriangle, 
  CheckCircle2, 
  Zap, 
  Heart,
  ZoomIn
} from 'lucide-react';

interface PatientDetailModalProps {
  patientId: string;
  onClose: () => void;
  onGoToWardRound: (id: string) => void;
}

export const PatientDetailModal: React.FC<PatientDetailModalProps> = ({
  patientId,
  onClose,
  onGoToWardRound,
}) => {
  const { patients, getDisplayPatientName } = useApp();
  const patient = patients.find(p => p.id === patientId);

  const [activeTab, setActiveTab] = useState<'overview' | 'labs' | 'files' | 'notes'>('overview');
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!patient) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold font-mono text-sm shadow-xs ${
              patient.triageLevel === 'emergency' ? 'bg-rose-600' : patient.triageLevel === 'warning' ? 'bg-amber-600' : 'bg-emerald-600'
            }`}>
              {patient.bedNumber}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold">
                  {getDisplayPatientName(patient)}
                </h2>
                <span className="text-xs text-slate-300 font-mono">
                  {patient.patientCode} · {patient.age}t · {patient.gender}
                </span>
              </div>
              <p className="text-xs text-sky-400">
                {patient.roomNumber} · {patient.arrhythmiaType}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {patient.status === 'active' && (
              <button
                onClick={() => {
                  onClose();
                  onGoToWardRound(patient.id);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Stethoscope className="w-4 h-4" />
                <span>Đi buồng</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigator */}
        <div className="flex items-center gap-2 px-6 border-b border-slate-200 bg-slate-50 shrink-0 text-xs font-medium">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Tổng quan bệnh án
          </button>
          <button
            onClick={() => setActiveTab('labs')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'labs'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Xét nghiệm & Điện giải ({patient.labTimeline.length})
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'files'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Tài liệu & ECG ({patient.files.length})
          </button>
          <button
            onClick={() => setActiveTab('notes')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'notes'
                ? 'border-sky-600 text-sky-700 font-bold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Lịch sử SOAPE ({patient.wardRoundNotes.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          
          {/* Tab 1: Overview */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Vitals row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 font-mono tabular-nums text-center">
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">NHỊP TIM</span>
                  <span className={`text-base font-bold ${patient.vitals.hr > 120 || patient.vitals.hr < 50 ? 'text-rose-600' : 'text-slate-900'}`}>
                    {patient.vitals.hr} bpm
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">HUYẾT ÁP</span>
                  <span className="text-base font-bold text-slate-900">{patient.vitals.bp} mmHg</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">SPO2</span>
                  <span className="text-base font-bold text-slate-900">{patient.vitals.spo2}%</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">NHIỆT ĐỘ</span>
                  <span className="text-base font-bold text-slate-900">{patient.vitals.temp}°C</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block font-sans">NHỊP THỞ</span>
                  <span className="text-base font-bold text-slate-900">{patient.vitals.rr} l/p</span>
                </div>
              </div>

              {/* Clinical Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm border-b pb-1">Thông Tin Tiếp Nhận</h4>
                  <p><strong>Ngày vào viện:</strong> {patient.admissionDate}</p>
                  <p><strong>Chẩn đoán vào khoa:</strong> {patient.admissionDiagnosis}</p>
                  <p><strong>Loại rối loạn nhịp:</strong> {patient.arrhythmiaType}</p>
                  <p><strong>Phân tầng Triage:</strong> {patient.triageLevel === 'emergency' ? '🔴 Cấp cứu khẩn' : patient.triageLevel === 'warning' ? '🟡 Theo dõi sát' : '🟢 Ổn định'}</p>
                  <p><strong>Thiết bị tạo nhịp:</strong> {patient.pacemakerStatus || 'Chưa có'}</p>
                  <p><strong>Dị ứng thuốc:</strong> {patient.allergies || 'Không ghi nhận'}</p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                  <h4 className="font-bold text-slate-900 text-sm border-b pb-1">Phân Công Ca Trực</h4>
                  <p><strong>Bác sĩ điều trị:</strong> {patient.attendingDoctor}</p>
                  <p><strong>Điều dưỡng phụ trách:</strong> {patient.primaryNurse}</p>
                  <p><strong>Khoa phòng:</strong> Khoa Rối loạn nhịp tim - BVĐK TP Quảng Ninh</p>
                  <p><strong>CCCD/BHYT:</strong> {patient.nationalIdMasked}</p>
                </div>
              </div>

              {/* Medications List */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2">
                <h4 className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-sky-600" />
                  Y Lệnh Thuốc Đang Dùng ({patient.medications.length})
                </h4>
                <div className="divide-y divide-slate-100">
                  {patient.medications.map(m => (
                    <div key={m.id} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        {m.imageUrl && (
                          <div
                            onClick={() => setPreviewImage(m.imageUrl!)}
                            className="w-10 h-10 rounded-lg border border-sky-300 overflow-hidden bg-white shrink-0 cursor-pointer shadow-2xs hover:ring-2 hover:ring-sky-500 transition-all"
                            title="Bấm để xem ảnh thuốc phóng to"
                          >
                            <img src={m.imageUrl} alt={m.name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 text-xs sm:text-sm">{m.name}</div>
                          <div className="text-slate-500 text-xs">{m.dosage} · {m.time} ({m.route})</div>
                        </div>
                      </div>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded shrink-0 ${
                        m.takenToday ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {m.takenToday ? '✓ Đã cho dùng' : 'Chưa dùng'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Lab Results Matrix (6 Groups) */}
          {activeTab === 'labs' && (
            <div className="space-y-4">
              <LabSummaryTable patient={patient} />
            </div>
          )}

          {/* Tab 3: Medical Files & Images */}
          {activeTab === 'files' && (
            <div className="space-y-3">
              {patient.files.length === 0 ? (
                <p className="text-center py-8 text-slate-400">Chưa có file hoặc hình ảnh nào được tải lên.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {patient.files.map(file => (
                    <div key={file.id} className="p-3 rounded-xl border border-slate-200 bg-white space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900 truncate max-w-[200px]">{file.name}</span>
                        <span className="text-[10px] font-mono text-slate-400">{file.size}</span>
                      </div>

                      {file.type === 'ecg_image' && (
                        <div 
                          onClick={() => setPreviewImage(file.url)}
                          className="relative h-32 bg-slate-100 rounded-lg overflow-hidden cursor-pointer group"
                        >
                          <img src={file.url} alt={file.name} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                            <ZoomIn className="w-5 h-5 mr-1" />
                            <span>Phóng to</span>
                          </div>
                        </div>
                      )}

                      <p className="text-[11px] text-slate-500">{file.description}</p>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Đăng bởi: {file.uploadedBy} · {file.uploadedAt}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Ward Round SOAPE Notes History */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              {patient.wardRoundNotes.length === 0 ? (
                <p className="text-center py-8 text-slate-400">Chưa có ghi chép đi buồng nào.</p>
              ) : (
                <div className="space-y-3">
                  {patient.wardRoundNotes.map((note, idx) => (
                    <div key={`${note.id}-${idx}`} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                      <div className="flex items-center justify-between font-mono text-slate-500 border-b pb-1.5">
                        <span className="font-bold text-slate-900 font-sans">{note.doctorName}</span>
                        <span>{note.date} {note.time}</span>
                      </div>
                      <div className="space-y-1">
                        <p><strong>S:</strong> {note.subjective}</p>
                        <p><strong>O:</strong> {note.objective}</p>
                        <p><strong>A:</strong> {note.assessment}</p>
                        <p><strong>P:</strong> {note.plan}</p>
                        <p><strong>E:</strong> {note.evaluation}</p>
                      </div>

                      {(note.handwritingSketch || note.planSketch) && (
                        <div className="mt-2 pt-2 border-t border-slate-200 flex items-center gap-3 flex-wrap">
                          {note.handwritingSketch && (
                            <div>
                              <span className="text-[10px] text-slate-500 block mb-1">Phác thảo ECG:</span>
                              <img 
                                src={note.handwritingSketch} 
                                alt="Bản vẽ điện tim" 
                                onClick={() => setPreviewImage(note.handwritingSketch!)}
                                className="h-16 border border-slate-200 rounded bg-white p-1 cursor-pointer hover:opacity-90"
                              />
                            </div>
                          )}
                          {note.planSketch && (
                            <div>
                              <span className="text-[10px] text-sky-800 font-semibold block mb-1 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                <span>Phác thảo can thiệp & y lệnh:</span>
                              </span>
                              <img 
                                src={note.planSketch} 
                                alt="Phác thảo can thiệp" 
                                onClick={() => setPreviewImage(note.planSketch!)}
                                className="h-16 border border-sky-300 rounded bg-white p-1 cursor-pointer hover:opacity-90"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

        {/* Image Zoom Modal */}
        {previewImage && (
          <div className="fixed inset-0 z-60 bg-black/80 flex items-center justify-center p-4">
            <div className="relative max-w-3xl w-full">
              <button
                onClick={() => setPreviewImage(null)}
                className="absolute top-2 right-2 p-2 bg-slate-800 text-white rounded-full hover:bg-slate-700"
              >
                <X className="w-6 h-6" />
              </button>
              <img src={previewImage} alt="ECG Full View" className="w-full max-h-[80vh] object-contain rounded-lg" />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
