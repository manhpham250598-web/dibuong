import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { 
  FileSpreadsheet, 
  UploadCloud, 
  Download, 
  Printer, 
  FileText, 
  Image as ImageIcon, 
  FileCode, 
  CheckCircle2, 
  AlertCircle,
  FileCheck2,
  Calendar,
  Layers,
  HeartPulse
} from 'lucide-react';
import { downloadLabImportTemplate, parseExcelOrCsvLabFile, exportPatientsToExcel } from '../utils/excelExport.ts';
import { MedicalFile } from '../types.ts';

interface ReportsAndImportProps {
  onOpenPrintReport: () => void;
}

export const ReportsAndImport: React.FC<ReportsAndImportProps> = ({ onOpenPrintReport }) => {
  const { 
    patients, 
    currentUser, 
    addLabResult, 
    addMedicalFile, 
    showToast,
    getDisplayPatientName 
  } = useApp();

  const activePatients = patients.filter(p => p.status === 'active');

  // Excel Import State
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importSummary, setImportSummary] = useState<string | null>(null);

  // File Upload State
  const [selectedPatientIdForUpload, setSelectedPatientIdForUpload] = useState<string>(activePatients[0]?.id || '');
  const [fileType, setFileType] = useState<'ecg_image' | 'ultrasound_image' | 'pdf_record' | 'csv_data'>('ecg_image');
  const [fileDescription, setFileDescription] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileDataUrl, setSelectedFileDataUrl] = useState('');
  const [fileSizeFormatted, setFileSizeFormatted] = useState('');

  // Handle Excel/CSV file selection
  const handleExcelFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    setImportSummary(null);

    const result = await parseExcelOrCsvLabFile(file);
    setIsParsingExcel(false);

    if (result.success && result.parsedRecords.length > 0) {
      setParsedRows(result.parsedRecords);
      setImportSummary(`Đã đọc thành công ${result.parsedRecords.length} dòng kết quả xét nghiệm từ file "${file.name}".`);
      showToast(`Đã đọc ${result.parsedRecords.length} kết quả từ file Excel!`, 'success');
    } else {
      setParsedRows([]);
      setImportSummary(result.errorMessage || 'Không thể trích xuất dữ liệu từ file.');
      showToast(result.errorMessage || 'Lỗi khi đọc file Excel', 'error');
    }
  };

  // Confirm import into matched patient records
  const handleConfirmImportLabs = () => {
    let matchedCount = 0;
    parsedRows.forEach(item => {
      // Tìm bệnh nhân theo Mã BA hoặc Họ tên
      const patient = patients.find(p => 
        (item.patientCode && p.patientCode.toLowerCase() === item.patientCode.toLowerCase()) ||
        (item.patientName && p.fullName.toLowerCase() === item.patientName.toLowerCase())
      );

      if (patient) {
        addLabResult(patient.id, item.lab);
        matchedCount++;
      }
    });

    if (matchedCount > 0) {
      showToast(`Đã cập nhật thành công ${matchedCount} kết quả xét nghiệm vào hồ sơ bệnh án!`, 'success');
      setParsedRows([]);
      setImportSummary(null);
    } else {
      showToast('Không tìm thấy bệnh nhân nào khớp với Mã Bệnh Án trong file Excel.', 'error');
    }
  };

  // Handle Medical File Selection (PDF, Image, CSV)
  const handleMedicalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setFileSizeFormatted(`${(file.size / 1024 / 1024).toFixed(1)} MB`);

    const reader = new FileReader();
    reader.onload = () => {
      setSelectedFileDataUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Save uploaded file
  const handleSaveMedicalFile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientIdForUpload || !selectedFileName || !selectedFileDataUrl) {
      showToast('Vui lòng chọn bệnh nhân và file cần tải lên.', 'error');
      return;
    }

    const newFile: MedicalFile = {
      id: `file-${Date.now()}`,
      name: selectedFileName,
      type: fileType,
      url: selectedFileDataUrl,
      size: fileSizeFormatted || '1.2 MB',
      uploadedAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
      uploadedBy: `${currentUser.title} ${currentUser.name}`,
      description: fileDescription || 'Tài liệu xét nghiệm / hình ảnh điện tim',
    };

    addMedicalFile(selectedPatientIdForUpload, newFile);

    // Reset inputs
    setSelectedFileName('');
    setSelectedFileDataUrl('');
    setFileDescription('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Report Export Hub */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-700 tracking-wide uppercase">
            <span>Báo cáo tự động & Quản lý file</span>
            <span aria-hidden="true">·</span>
            <span>Chuẩn Bộ Y Tế</span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-1">
            Trung Tâm Báo Cáo Giao Ban & Nhập Dữ Liệu
          </h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Tự động tổng hợp danh sách bệnh nhân, biên bản giao ban ca trực A4 và nhập liệu xét nghiệm từ Excel.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <button
            onClick={onOpenPrintReport}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Biên Bản Giao Ban (PDF/In A4)</span>
          </button>

          <button
            onClick={() => exportPatientsToExcel(patients)}
            className="flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 text-xs sm:text-sm font-medium rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất Toàn Bộ Excel</span>
          </button>
        </div>
      </div>

      {/* 2 Main Sections Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Section 1: Excel / CSV Lab Result Import */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <FileSpreadsheet className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  Nhập Kết Quả Xét Nghiệm Từ Excel / CSV
                </h3>
                <p className="text-[11px] text-slate-500">
                  Tự động nhận diện Troponin, Điện giải K+, Na+, Mg2+, INR, Creatinine
                </p>
              </div>
            </div>

            <button
              onClick={downloadLabImportTemplate}
              className="text-xs text-sky-700 hover:text-sky-900 font-semibold hover:underline flex items-center gap-1"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file mẫu Excel</span>
            </button>
          </div>

          {/* Upload Area */}
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-sky-400 transition-colors bg-slate-50/50">
            <UploadCloud className="w-10 h-10 mx-auto text-slate-400 mb-2" />
            <p className="text-xs font-semibold text-slate-700">
              Chọn hoặc kéo thả file Excel (.xlsx, .xls) hoặc CSV kết quả xét nghiệm
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Hệ thống sẽ tự động ghép kết quả theo <strong>Mã Bệnh Án</strong> của người bệnh
            </p>
            <label className="mt-3 inline-block cursor-pointer px-4 py-2 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 hover:bg-slate-50 shadow-xs transition-colors">
              <span>{isParsingExcel ? 'Đang đọc dữ liệu...' : 'Chọn file từ máy tính'}</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleExcelFileChange}
                disabled={isParsingExcel}
                className="hidden"
              />
            </label>
          </div>

          {/* Import Preview */}
          {importSummary && (
            <div className="p-3 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{importSummary}</span>
              </div>
              {parsedRows.length > 0 && (
                <button
                  onClick={handleConfirmImportLabs}
                  className="px-3 py-1 bg-emerald-600 text-white text-xs font-semibold rounded hover:bg-emerald-700 shadow-xs transition-colors"
                >
                  Xác nhận lưu ({parsedRows.length})
                </button>
              )}
            </div>
          )}

          {parsedRows.length > 0 && (
            <div className="border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
              <table className="w-full text-left text-[11px]">
                <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-2">Mã BA</th>
                    <th className="p-2">Troponin</th>
                    <th className="p-2">K+</th>
                    <th className="p-2">INR</th>
                    <th className="p-2">Tóm tắt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                  {parsedRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 font-bold text-slate-900">{row.patientCode}</td>
                      <td className="p-2">{row.lab.troponinI ?? '--'}</td>
                      <td className={`p-2 font-bold ${row.lab.k && row.lab.k < 3.5 ? 'text-rose-600' : ''}`}>
                        {row.lab.k ?? '--'}
                      </td>
                      <td className="p-2">{row.lab.inr ?? '--'}</td>
                      <td className="p-2 text-slate-600 font-sans truncate max-w-[120px]">{row.lab.ecgSummary || 'Đạt'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Section 2: Medical File Upload (PDF, CSV, ECG Scan Images) */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Tải Lên Tài Liệu & Ảnh ECG Chuẩn Y Tế
              </h3>
              <p className="text-[11px] text-slate-500">
                Hỗ trợ file PDF hồ sơ bệnh án, CSV dữ liệu và ảnh điện tâm đồ 12 chuyển đạo
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveMedicalFile} className="space-y-3">
            {/* Target Patient Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Gán vào bệnh nhân:
              </label>
              <select
                value={selectedPatientIdForUpload}
                onChange={(e) => setSelectedPatientIdForUpload(e.target.value)}
                className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
              >
                {activePatients.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.bedNumber} - {getDisplayPatientName(p)} ({p.patientCode} · {p.arrhythmiaType})
                  </option>
                ))}
              </select>
            </div>

            {/* Document / File Type */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Định dạng tài liệu:
                </label>
                <select
                  value={fileType}
                  onChange={(e: any) => setFileType(e.target.value)}
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                >
                  <option value="ecg_image">Ảnh Điện tâm đồ (ECG 12 cần)</option>
                  <option value="ultrasound_image">Ảnh Siêu âm Doppler tim</option>
                  <option value="pdf_record">Hồ sơ bệnh án (PDF)</option>
                  <option value="csv_data">Bảng dữ liệu máy theo dõi (CSV)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Mô tả vắn tắt:
                </label>
                <input
                  type="text"
                  value={fileDescription}
                  onChange={(e) => setFileDescription(e.target.value)}
                  placeholder="Vd: ECG sau sốc điện chuyển nhịp..."
                  className="w-full text-xs p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900"
                />
              </div>
            </div>

            {/* File Input */}
            <div className="border border-slate-200 rounded-lg p-3 bg-slate-50/50 flex items-center justify-between">
              <div className="truncate text-xs">
                {selectedFileName ? (
                  <span className="font-semibold text-slate-800">
                    {selectedFileName} <span className="text-slate-400 font-normal">({fileSizeFormatted})</span>
                  </span>
                ) : (
                  <span className="text-slate-400 italic">Chưa chọn file (PDF, PNG, JPG, CSV)...</span>
                )}
              </div>
              <label className="cursor-pointer px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors shrink-0">
                <span>Duyệt file</span>
                <input
                  type="file"
                  accept=".pdf,.csv,.png,.jpg,.jpeg,.dicom"
                  onChange={handleMedicalFileChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={!selectedFileName}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg shadow-xs disabled:opacity-40 transition-colors"
              >
                Lưu vào Hồ Sơ Bệnh Nhân
              </button>
            </div>
          </form>
        </div>

      </div>

    </div>
  );
};
