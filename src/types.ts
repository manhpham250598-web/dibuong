export type UserRole = 'doctor' | 'nurse' | 'head_doctor' | 'admin';

export interface User {
  id: string;
  username: string;
  password?: string; // Mật khẩu tài khoản nội bộ
  name: string;
  title: string; // e.g. "BS. CKII", "ThS. BS", "CNĐD", "ĐD", "Quản trị viên"
  role: UserRole;
  department: string;
  licenseNumber: string;
  phoneNumber?: string;
  status: 'active' | 'locked';
  createdAt?: string;
  avatar?: string;
}

export type TriageLevel = 'emergency' | 'warning' | 'stable';

export type ArrhythmiaType =
  | 'Rung nhĩ (AFib)'
  | 'Cuồng nhĩ (AFlut)'
  | 'Cơn nhịp nhanh kịch phát trên thất (SVT)'
  | 'Ngoại tâm thu thất (PVC/Lown IV)'
  | 'Nhịp nhanh thất (VT)'
  | 'Block nhĩ thất độ III (Complete AV Block)'
  | 'Hội chứng Brugada'
  | 'Hội chứng suy nút xoang (SSS)'
  | 'Hội chứng QT dài (LQTS)'
  | 'Sau cấy Máy tạo nhịp / ICD'
  | 'Khác';

export interface Vitals {
  hr: number; // Heart rate (bpm)
  bp: string; // Blood pressure (e.g. "120/80")
  spo2: number; // %
  temp: number; // °C
  rr: number; // Respiratory rate (lần/phút)
  timestamp: string;
}

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  route: string; // "Uống", "Tiêm TM", "Truyền TM"
  time: string; // "08:00 - 20:00"
  takenToday: boolean;
  prescribedBy: string;
  imageUrl?: string; // Ảnh đính kèm thuốc (ảnh chụp vỉ, bao bì, nhãn lọ thuốc)
  imageNote?: string;
}

export interface LabEntry {
  id: string;
  date: string;
  // 1. Khí máu động mạch (ABG)
  ph?: number;
  pco2?: number; // mmHg
  po2?: number; // mmHg
  hco3?: number; // mmol/L
  sao2?: number; // %
  lactat?: number; // mmol/L

  // 2. Huyết học & Miễn dịch
  wbc?: number; // G/L
  neu?: number; // %
  lym?: number; // %
  pct?: number; // ng/mL (Procalcitonin)

  // 3. Hồng cầu & Đông máu
  hc?: number; // T/L
  hb?: number; // g/dL
  hct?: number; // %
  plt?: number; // G/L
  inr?: number; // INR
  pt?: number; // %
  aptt?: number; // giây
  dimer?: number; // ng/mL (D-Dimer)

  // 4. Chức năng thận, Điện giải & Đường máu
  ure?: number; // mmol/L
  cre?: number; // µmol/L (Creatinine)
  creatinine?: number; // synonym for cre
  ck?: number; // U/L (Creatine Kinase)
  na?: number; // mmol/L
  k?: number; // mmol/L
  mg?: number; // mmol/L
  ca?: number; // mmol/L
  caIon?: number; // mmol/L (Ca++)
  glu?: number; // mmol/L (Glucose)
  egfr?: number;

  // 5. Chức năng gan & Protein
  got?: number; // U/L (AST)
  gpt?: number; // U/L (ALT)
  alb?: number; // g/L (Albumin)
  pro?: number; // g/L (Protein toàn phần)
  biltp?: number; // µmol/L (Bilirubin toàn phần)
  biltt?: number; // µmol/L (Bilirubin trực tiếp)

  // 6. Dấu ấn sinh học tim mạch
  tpnThs?: number; // ng/L (Troponin T hs)
  troponinI?: number; // ng/mL
  bnp?: number; // pg/mL (NT-proBNP)
  ckmb?: number; // U/L

  ecgSummary?: string;
  notes?: string;
  rawString?: string;
}

export interface MedicalFile {
  id: string;
  name: string;
  type: 'ecg_image' | 'ultrasound_image' | 'pdf_record' | 'csv_data' | 'other';
  url: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
  description?: string;
}

export interface WardTask {
  id: string;
  task: string;
  done: boolean;
  assignedRole: 'doctor' | 'nurse' | 'both';
  priority: 'high' | 'normal'; // high = Y lệnh khẩn cấp, normal = Y lệnh thường quy
  category?: 'can_thiep' | 'thuoc' | 'xet_nghiem' | 'cham_soc';
  createdAt: string;
  fromPlan?: boolean; // Tự động tạo từ mục Plan của SOAPE
}

export interface WardRoundNote {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  doctorName: string;
  subjective: string; // S
  objective: string; // O
  assessment: string; // A
  plan: string; // P
  evaluation: string; // E
  handwritingSketch?: string;
  planSketch?: string; // Bản vẽ phác thảo kế hoạch can thiệp & y lệnh viết tay
  voiceNoteUrl?: string;
  voiceTranscription?: string;
}

export interface Patient {
  id: string;
  patientCode: string;
  medicalRecordCode?: string; // Số bệnh án (e.g. "26.052370")
  hospitalId?: string; // Mã y tế (e.g. "18061239")
  department?: string; // Khoa (e.g. "Khoa Nội Tim Mạch")
  nationalIdMasked: string;
  fullName: string;
  gender: 'Nam' | 'Nữ';
  age: number;
  roomNumber: string;
  bedNumber: string;
  admissionDate: string;
  admissionDiagnosis: string;
  arrhythmiaType: ArrhythmiaType;
  triageLevel: TriageLevel;
  pacemakerStatus?: string;
  allergies?: string;
  attendingDoctor: string;
  primaryNurse: string;
  admissionSheetUrl?: string; // Ảnh chụp phiếu theo dõi điều trị từ bệnh viện
  vitals: Vitals;
  medications: Medication[];
  labTimeline: LabEntry[];
  files: MedicalFile[];
  wardTasks: WardTask[];
  wardRoundNotes: WardRoundNote[];
  status: 'active' | 'discharged' | 'archived';
  dischargeDate?: string;
  dischargeSummary?: string;
}
