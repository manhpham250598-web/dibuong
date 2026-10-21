import { LabEntry, WardTask } from '../types.ts';

/**
 * Trích xuất các chỉ số xét nghiệm từ chuỗi văn bản do phòng Lab hoặc bệnh viện trả về
 * Ví dụ:
 * pH: 6.907; PCO2: 66.7; PO2: 32.1; HCO3: 13.4; SaO2: 30.1; Lactat: 12.84;
 * WBC: 13.00; NEU: 46; LYM: 43.6; PCT: 0.089;
 * HC: 4.67; Hb: 12.8; Hct: 42; PLT: 189; INR: 1.05; PT: 93; Aptt: 26.2; Dimer: 17435;
 * Ure: 11.04; Cre: 202.7; CK: 106.4; Na: 136.6; K: 4.28; Mg: 1.04; Ca: 2.39; Ca+: 1.25; Glu: 11.9;
 * GOT: 32.9; GPT: 12.3; Alb: 39.12; Pro: 79.13; Biltp: 6.56; Biltt: 0.65;
 * TpnThs: 34.28; BNP: 552.3;
 */
export function parseLabString(text: string): Partial<LabEntry> {
  const result: Partial<LabEntry> = {
    rawString: text,
  };

  const extractNum = (patterns: string[]): number | undefined => {
    for (const pattern of patterns) {
      // Regex tìm dạng: "Tên_Chỉ_Số[:= ]\s*(-?[0-9]+([.,][0-9]+)?)"
      const regex = new RegExp(`(?:^|[;\\s,])(?:${pattern})\\s*[:=]\\s*([0-9]+(?:[.,][0-9]+)?)`, 'i');
      const match = text.match(regex);
      if (match && match[1]) {
        const val = parseFloat(match[1].replace(',', '.'));
        if (!isNaN(val)) return val;
      }
    }
    return undefined;
  };

  // 1. Khí máu động mạch
  result.ph = extractNum(['pH']);
  result.pco2 = extractNum(['PCO2', 'pCO2']);
  result.po2 = extractNum(['PO2', 'pO2']);
  result.hco3 = extractNum(['HCO3', 'HCO3-']);
  result.sao2 = extractNum(['SaO2', 'sao2']);
  result.lactat = extractNum(['Lactat', 'Lactate']);

  // 2. Huyết học & Miễn dịch
  result.wbc = extractNum(['WBC', 'Leukocyte', 'BachCau']);
  result.neu = extractNum(['NEU', 'Neutrophil']);
  result.lym = extractNum(['LYM', 'Lymphocyte']);
  result.pct = extractNum(['PCT', 'Procalcitonin']);

  // 3. Hồng cầu & Đông máu
  result.hc = extractNum(['HC', 'RBC', 'HongCau']);
  result.hb = extractNum(['Hb', 'HGB', 'Hemoglobin']);
  result.hct = extractNum(['Hct', 'HCT']);
  result.plt = extractNum(['PLT', 'TieuCau', 'Platelet']);
  result.inr = extractNum(['INR']);
  result.pt = extractNum(['PT']);
  result.aptt = extractNum(['Aptt', 'aPTT']);
  result.dimer = extractNum(['Dimer', 'D-Dimer', 'd-dimer']);

  // 4. Thận, Điện giải & Đường máu
  result.ure = extractNum(['Ure', 'Urea', 'BUN']);
  result.cre = extractNum(['Cre', 'Creatinine']);
  result.creatinine = result.cre;
  result.ck = extractNum(['CK', 'CPK']);
  result.na = extractNum(['Na', 'Natri', 'Na+']);
  result.k = extractNum(['K', 'Kali', 'K+']);
  result.mg = extractNum(['Mg', 'Magnesi', 'Magie', 'Mg2+']);
  result.ca = extractNum(['Ca', 'Canxi']);
  result.caIon = extractNum(['Ca\\+', 'Ca\\+\\+', 'CanxiIon']);
  result.glu = extractNum(['Glu', 'Glucose', 'DuongMau']);

  // 5. Gan & Mật
  result.got = extractNum(['GOT', 'AST']);
  result.gpt = extractNum(['GPT', 'ALT']);
  result.alb = extractNum(['Alb', 'Albumin']);
  result.pro = extractNum(['Pro', 'Protein']);
  result.biltp = extractNum(['Biltp', 'BilirubinTP', 'BilTP']);
  result.biltt = extractNum(['Biltt', 'BilirubinTT', 'BilTT']);

  // 6. Dấu ấn sinh học tim mạch
  result.tpnThs = extractNum(['TpnThs', 'TroponinThs', 'TropThs', 'hsTnT']);
  result.troponinI = extractNum(['TroponinI', 'TropI']);
  result.bnp = extractNum(['BNP', 'proBNP', 'NT-proBNP']);
  result.ckmb = extractNum(['CKMB', 'CK-MB']);

  return result;
}

/**
 * Phân tích kế hoạch can thiệp & y lệnh điều trị trong mục Plan của SOAPE thành các đầu việc Checklist
 */
export function parsePlanToTasks(planText: string): Array<Omit<WardTask, 'id' | 'createdAt'>> {
  if (!planText || !planText.trim()) return [];

  // Tách văn bản theo dòng, hoặc dấu chấm phẩy, hoặc dấu gạch đầu dòng
  const lines = planText
    .split(/\n|;/)
    .map(l => l.trim())
    .filter(l => l.length > 3);

  const urgentKeywords = [
    'khẩn', 'ngay', 'cấp cứu', 'sốc điện', 'bù kali', 'kali clorid',
    'amiodarone', 'cordarone', 'noradrenalin', 'adrenalin', 'icd',
    'tạo nhịp', 'monitor liên tục', 'đo lại sau', 'truyền nhanh', 'chuyển nhịp'
  ];

  const doctorKeywords = [
    'hội chẩn', 'chỉ định', 'tư vấn', 'kê đơn', 'cấy máy', 'triệt đốt', 'mổ', 'giải thích'
  ];

  return lines.map(line => {
    // Làm sạch tiền tố số thứ tự (vd: "1.", "2)", "- ", "+ ")
    const cleaned = line.replace(/^[0-9]+[.)]\s*/, '').replace(/^[-+•*]\s*/, '').trim();
    const lower = cleaned.toLowerCase();

    // Xác định mức độ khẩn cấp (Khẩn vs Thường quy)
    const isUrgent = urgentKeywords.some(kw => lower.includes(kw));

    // Xác định người thực hiện
    let assignedRole: 'doctor' | 'nurse' | 'both' = 'nurse';
    if (doctorKeywords.some(kw => lower.includes(kw))) {
      assignedRole = 'doctor';
    } else if (isUrgent) {
      assignedRole = 'both';
    }

    return {
      task: cleaned,
      done: false,
      priority: isUrgent ? 'high' : 'normal',
      assignedRole,
      fromPlan: true,
    };
  });
}
