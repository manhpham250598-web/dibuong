import * as XLSX from 'xlsx';
import { Patient, LabEntry } from '../types.ts';

/**
 * Xuất toàn bộ dữ liệu danh sách bệnh nhân và xét nghiệm ra file Excel đa sheet
 */
export function exportPatientsToExcel(patients: Patient[], fileName = 'DS_BenhNhan_KhoaRoiLoanNhipTim_QN.xlsx') {
  // Sheet 1: Bệnh nhân hiện diện
  const patientData = patients.map((p, index) => ({
    'STT': index + 1,
    'Mã Bệnh Án': p.patientCode,
    'Họ và Tên': p.fullName,
    'Tuổi': p.age,
    'Giới Tính': p.gender,
    'Buồng Bệnh': p.roomNumber,
    'Số Giường': p.bedNumber,
    'Ngày Vào Viện': p.admissionDate,
    'Chẩn Đoán Lâm Sàng': p.admissionDiagnosis,
    'Loại Rối Loạn Nhịp': p.arrhythmiaType,
    'Phân Tầng Nguy Cơ': p.triageLevel === 'emergency' ? 'Cấp cứu (Đỏ)' : p.triageLevel === 'warning' ? 'Theo dõi sát (Vàng)' : 'Ổn định (Xanh)',
    'Nhịp Tim (bpm)': p.vitals.hr,
    'Huyết Áp (mmHg)': p.vitals.bp,
    'SpO2 (%)': p.vitals.spo2,
    'Tình Trạng Máy Tạo Nhịp': p.pacemakerStatus || 'Không',
    'Bác Sĩ Điều Trị': p.attendingDoctor,
    'Điều Dưỡng Phụ Trách': p.primaryNurse,
    'Trạng Thái': p.status === 'active' ? 'Đang điều trị' : p.status === 'discharged' ? 'Đã ra viện' : 'Lưu trữ',
  }));

  // Sheet 2: Toàn bộ chỉ số xét nghiệm & điện giải đồ theo thời gian
  const labData: any[] = [];
  patients.forEach(p => {
    p.labTimeline.forEach(lab => {
      labData.push({
        'Mã Bệnh Án': p.patientCode,
        'Họ và Tên': p.fullName,
        'Thời Gian Xét Nghiệm': lab.date,
        'pH': lab.ph ?? '',
        'PCO2 (mmHg)': lab.pco2 ?? '',
        'PO2 (mmHg)': lab.po2 ?? '',
        'HCO3 (mmol/L)': lab.hco3 ?? '',
        'SaO2 (%)': lab.sao2 ?? '',
        'Lactat (mmol/L)': lab.lactat ?? '',
        'WBC (G/L)': lab.wbc ?? '',
        'NEU (%)': lab.neu ?? '',
        'LYM (%)': lab.lym ?? '',
        'PCT (ng/mL)': lab.pct ?? '',
        'HC (T/L)': lab.hc ?? '',
        'Hb (g/dL)': lab.hb ?? '',
        'Hct (%)': lab.hct ?? '',
        'PLT (G/L)': lab.plt ?? '',
        'INR': lab.inr ?? '',
        'PT (%)': lab.pt ?? '',
        'aPTT (s)': lab.aptt ?? '',
        'D-Dimer (ng/mL)': lab.dimer ?? '',
        'Ure (mmol/L)': lab.ure ?? '',
        'Creatinine (µmol/L)': lab.cre ?? lab.creatinine ?? '',
        'CK (U/L)': lab.ck ?? '',
        'Na+ (mmol/L)': lab.na ?? '',
        'K+ (mmol/L)': lab.k ?? '',
        'Mg2+ (mmol/L)': lab.mg ?? '',
        'Ca (mmol/L)': lab.ca ?? '',
        'Ca++ (mmol/L)': lab.caIon ?? '',
        'Glucose (mmol/L)': lab.glu ?? '',
        'GOT/AST (U/L)': lab.got ?? '',
        'GPT/ALT (U/L)': lab.gpt ?? '',
        'Albumin (g/L)': lab.alb ?? '',
        'Protein (g/L)': lab.pro ?? '',
        'Troponin T hs (ng/L)': lab.tpnThs ?? '',
        'Troponin I (ng/mL)': lab.troponinI ?? '',
        'BNP (pg/mL)': lab.bnp ?? '',
        'Tóm Tắt Điện Tâm Đồ (ECG)': lab.ecgSummary ?? '',
        'Ghi Chú Xét Nghiệm': lab.notes ?? '',
      });
    });
  });

  const wb = XLSX.utils.book_new();
  const wsPatients = XLSX.utils.json_to_sheet(patientData);
  const wsLabs = XLSX.utils.json_to_sheet(labData.length > 0 ? labData : [{ 'Thông báo': 'Chưa có dữ liệu xét nghiệm' }]);

  // Cấu hình độ rộng cột cho đẹp mắt
  wsPatients['!cols'] = [
    { wch: 6 },  // STT
    { wch: 18 }, // Mã BA
    { wch: 22 }, // Họ tên
    { wch: 8 },  // Tuổi
    { wch: 10 }, // Giới tính
    { wch: 24 }, // Buồng
    { wch: 12 }, // Giường
    { wch: 14 }, // Ngày vào
    { wch: 38 }, // Chẩn đoán
    { wch: 28 }, // Loại loạn nhịp
    { wch: 18 }, // Phân tầng
    { wch: 14 }, // HR
    { wch: 16 }, // BP
    { wch: 10 }, // SpO2
    { wch: 26 }, // Máy tạo nhịp
    { wch: 24 }, // Bác sĩ
    { wch: 22 }, // Điều dưỡng
    { wch: 14 }, // Trạng thái
  ];

  XLSX.utils.book_append_sheet(wb, wsPatients, 'Danh Sách Bệnh Nhân');
  XLSX.utils.book_append_sheet(wb, wsLabs, 'Xét Nghiệm & Điện Giải');

  XLSX.writeFile(wb, fileName);
}

/**
 * Tải file Excel mẫu để khoa phòng hoặc khoa Xét nghiệm nhập dữ liệu
 */
export function downloadLabImportTemplate() {
  const templateRows = [
    {
      'Mã Bệnh Án': 'QN-TIM-2026-081',
      'Họ và Tên': 'Trần Văn Mạnh',
      'Thời Gian XN (YYYY-MM-DD HH:mm)': '2026-10-20 10:30',
      'Troponin I (ng/mL)': 0.04,
      'CK-MB (U/L)': 20,
      'Kali K+ (mmol/L)': 4.2,
      'Natri Na+ (mmol/L)': 140,
      'Magnesi Mg2+ (mmol/L)': 0.90,
      'Creatinine (µmol/L)': 88,
      'eGFR (mL/min)': 80,
      'INR': 1.2,
      'NT-proBNP (pg/mL)': 1300,
      'Tóm Tắt ECG': 'Nhịp xoang 75 ck/p, không biến đổi ST-T mới',
      'Ghi Chú': 'Chỉ số điện giải trong giới hạn bình thường',
    },
    {
      'Mã Bệnh Án': 'QN-TIM-2026-084',
      'Họ và Tên': 'Nguyễn Thị Bích Hồng',
      'Thời Gian XN (YYYY-MM-DD HH:mm)': '2026-10-20 10:45',
      'Troponin I (ng/mL)': 0.015,
      'CK-MB (U/L)': '',
      'Kali K+ (mmol/L)': 4.4,
      'Natri Na+ (mmol/L)': 142,
      'Magnesi Mg2+ (mmol/L)': 0.85,
      'Creatinine (µmol/L)': 74,
      'eGFR (mL/min)': 92,
      'INR': 2.3,
      'NT-proBNP (pg/mL)': 380,
      'Tóm Tắt ECG': 'Rung nhĩ đáp ứng thất kiểm soát 90 ck/p',
      'Ghi Chú': 'Đạt ngưỡng điều trị chống đông INR 2.0-3.0',
    },
  ];

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(templateRows);
  ws['!cols'] = [
    { wch: 18 }, { wch: 24 }, { wch: 28 }, { wch: 18 }, { wch: 14 },
    { wch: 16 }, { wch: 16 }, { wch: 18 }, { wch: 18 }, { wch: 14 },
    { wch: 10 }, { wch: 18 }, { wch: 36 }, { wch: 32 }
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Mau_Nhap_Xet_Nghiem');
  XLSX.writeFile(wb, 'Mau_Nhap_KetQua_XetNghiem_KhoaTimMach.xlsx');
}

/**
 * Đọc file Excel hoặc CSV từ người dùng tải lên và trích xuất dữ liệu xét nghiệm
 */
export async function parseExcelOrCsvLabFile(file: File): Promise<{
  success: boolean;
  importedCount: number;
  unmatchedCount: number;
  parsedRecords: Array<{
    patientCode: string;
    patientName?: string;
    lab: LabEntry;
  }>;
  errorMessage?: string;
}> {
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return { success: false, importedCount: 0, unmatchedCount: 0, parsedRecords: [], errorMessage: 'File không có trang tính (sheet) nào.' };
    }

    const worksheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

    if (!rows || rows.length === 0) {
      return { success: false, importedCount: 0, unmatchedCount: 0, parsedRecords: [], errorMessage: 'File trống hoặc không chứa dòng dữ liệu.' };
    }

    const parsedRecords: Array<{ patientCode: string; patientName?: string; lab: LabEntry }> = [];

    rows.forEach((row, idx) => {
      // Tìm mã bệnh án từ các biến thể tên cột phổ biến
      const code = row['Mã Bệnh Án'] || row['Ma Benh An'] || row['MaBA'] || row['patientCode'] || row['MÃ BA'] || row['Mã BA'] || '';
      const name = row['Họ và Tên'] || row['Ho va Ten'] || row['HoTen'] || row['fullName'] || '';
      const date = row['Thời Gian XN (YYYY-MM-DD HH:mm)'] || row['Thời Gian Xét Nghiệm'] || row['NgayXN'] || row['date'] || new Date().toISOString().slice(0, 16).replace('T', ' ');

      const troponin = parseFloat(row['Troponin I (ng/mL)'] ?? row['Troponin'] ?? row['troponinI']);
      const ckmb = parseFloat(row['CK-MB (U/L)'] ?? row['CKMB'] ?? row['ckmb']);
      const k = parseFloat(row['Kali K+ (mmol/L)'] ?? row['Kali'] ?? row['K+'] ?? row['k']);
      const na = parseFloat(row['Natri Na+ (mmol/L)'] ?? row['Natri'] ?? row['Na+'] ?? row['na']);
      const mg = parseFloat(row['Magnesi Mg2+ (mmol/L)'] ?? row['Magie'] ?? row['Mg2+'] ?? row['mg']);
      const creatinine = parseFloat(row['Creatinine (µmol/L)'] ?? row['Creatinine'] ?? row['creatinine']);
      const egfr = parseFloat(row['eGFR (mL/min)'] ?? row['eGFR'] ?? row['egfr']);
      const inr = parseFloat(row['INR'] ?? row['INR / PT'] ?? row['inr']);
      const bnp = parseFloat(row['NT-proBNP (pg/mL)'] ?? row['BNP'] ?? row['bnp']);
      const ecg = row['Tóm Tắt ECG'] || row['Tóm Tắt Điện Tâm Đồ (ECG)'] || row['ecgSummary'] || '';
      const notes = row['Ghi Chú'] || row['Ghi Chú Xét Nghiệm'] || row['notes'] || '';

      if (code || name) {
        parsedRecords.push({
          patientCode: String(code).trim(),
          patientName: String(name).trim(),
          lab: {
            id: `imported-lab-${Date.now()}-${idx}`,
            date: String(date).trim(),
            troponinI: isNaN(troponin) ? undefined : troponin,
            ckmb: isNaN(ckmb) ? undefined : ckmb,
            k: isNaN(k) ? undefined : k,
            na: isNaN(na) ? undefined : na,
            mg: isNaN(mg) ? undefined : mg,
            creatinine: isNaN(creatinine) ? undefined : creatinine,
            egfr: isNaN(egfr) ? undefined : egfr,
            inr: isNaN(inr) ? undefined : inr,
            bnp: isNaN(bnp) ? undefined : bnp,
            ecgSummary: ecg ? String(ecg).trim() : undefined,
            notes: notes ? String(notes).trim() : undefined,
          },
        });
      }
    });

    return {
      success: true,
      importedCount: parsedRecords.length,
      unmatchedCount: 0,
      parsedRecords,
    };
  } catch (err: any) {
    return {
      success: false,
      importedCount: 0,
      unmatchedCount: 0,
      parsedRecords: [],
      errorMessage: err?.message || 'Lỗi khi đọc file Excel/CSV.',
    };
  }
}
