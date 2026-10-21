import React, { useState } from 'react';
import { LabEntry, Patient } from '../types.ts';
import { parseLabString } from '../utils/labParser.ts';
import { 
  Activity, 
  AlertTriangle, 
  ClipboardPaste, 
  Copy, 
  Check, 
  Calendar, 
  ChevronRight,
  PlusCircle,
  X
} from 'lucide-react';
import { useApp } from '../context/AppContext.tsx';

interface LabSummaryTableProps {
  patient: Patient;
}

export const LabSummaryTable: React.FC<LabSummaryTableProps> = ({ patient }) => {
  const { addLabResult, showToast } = useApp();
  const [selectedLabId, setSelectedLabId] = useState<string | null>(patient.labTimeline[0]?.id || null);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [copied, setCopied] = useState(false);

  // Active lab entry
  const currentLab = patient.labTimeline.find(l => l.id === selectedLabId) || patient.labTimeline[0];

  const handleQuickPasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pasteText.trim()) return;

    const parsed = parseLabString(pasteText);
    const newLab: LabEntry = {
      id: `lab-${Date.now()}`,
      date: new Date().toISOString().slice(0, 16).replace('T', ' '),
      ...parsed,
      notes: 'Nhập nhanh từ chuỗi kết quả phòng xét nghiệm viện',
    };

    addLabResult(patient.id, newLab);
    setSelectedLabId(newLab.id);
    setIsPasteModalOpen(false);
    setPasteText('');
    showToast('Đã phân tích và lưu bảng kết quả xét nghiệm thành công!', 'success');
  };

  const handleSampleFill = () => {
    const sample = `pH: 6.907; PCO2: 66.7; PO2: 32.1; HCO3: 13.4; SaO2: 30.1; Lactat: 12.84; \nWBC: 13.00; NEU: 46; LYM: 43.6; PCT: 0.089; \nHC: 4.67; Hb: 12.8; Hct: 42; PLT: 189; INR: 1.05; PT: 93; Aptt: 26.2; Dimer: 17435; \nUre: 11.04; Cre: 202.7; CK: 106.4; Na: 136.6; K: 4.28; Mg: 1.04; Ca: 2.39; Ca+: 1.25; Glu: 11.9; \nGOT: 32.9; GPT: 12.3; Alb: 39.12; Pro: 79.13; Biltp: 6.56; Biltt: 0.65; \nTpnThs: 34.28; BNP: 552.3;`;
    setPasteText(sample);
  };

  // Helper check for abnormal or critical lab values
  const getBadgeClass = (isCritical?: boolean, isWarning?: boolean) => {
    if (isCritical) return 'bg-rose-100 text-rose-800 font-bold border-rose-300';
    if (isWarning) return 'bg-amber-50 text-amber-800 font-semibold border-amber-200';
    return 'bg-white text-slate-800 border-slate-200';
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
      
      {/* Table Header: Controls & Quick Paste Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Bảng Tóm Tắt Kết Quả Xét Nghiệm (6 Nhóm Lâm Sàng)
            </h3>
            <p className="text-[11px] text-slate-500">
              Khí máu · Bạch cầu · Huyết học & D-Dimer · Thận & Điện giải · Gan · Dấu ấn tim mạch
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setIsPasteModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-lg shadow-xs transition-colors"
          >
            <ClipboardPaste className="w-3.5 h-3.5" />
            <span>⚡ Dán nhanh kết quả</span>
          </button>
        </div>
      </div>

      {/* Historical timestamps selector tabs */}
      {patient.labTimeline.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[11px] text-slate-400 font-medium mr-1 shrink-0">Mốc xét nghiệm:</span>
          {patient.labTimeline.map((lab, idx) => (
            <button
              key={lab.id}
              onClick={() => setSelectedLabId(lab.id)}
              className={`px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap transition-colors border ${
                (currentLab?.id === lab.id)
                  ? 'bg-slate-900 text-white border-slate-900 font-bold'
                  : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {lab.date} {idx === 0 && '· Mới nhất'}
            </button>
          ))}
        </div>
      )}

      {/* Main Lab Matrix Table */}
      {!currentLab ? (
        <div className="text-center py-8 text-slate-400 text-xs italic">
          Bệnh nhân chưa có kết quả xét nghiệm. Bấm "⚡ Dán nhanh kết quả" để thêm dữ liệu.
        </div>
      ) : (
        <div className="space-y-3 font-mono text-xs tabular-nums">
          
          {/* Row 1: Khí Máu Động Mạch (ABG) */}
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-100/90 px-3 py-1.5 text-[11px] font-sans font-bold text-slate-700 flex items-center justify-between border-b border-slate-200">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                1. KHÍ MÁU ĐỘNG MẠCH (ABG) & TOAN KIỀM
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Đánh giá suy hô hấp, toan lactic & shock</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-200 bg-white">
              
              <div className={`p-2.5 ${getBadgeClass(currentLab.ph !== undefined && (currentLab.ph < 7.30 || currentLab.ph > 7.50))}`}>
                <div className="text-[10px] font-sans text-slate-500">pH (7.35-7.45)</div>
                <div className="text-sm font-bold mt-0.5">{currentLab.ph ?? '--'}</div>
                {currentLab.ph !== undefined && currentLab.ph < 7.30 && (
                  <span className="text-[9px] font-sans text-rose-700 font-semibold block">Toan nặng</span>
                )}
              </div>

              <div className={`p-2.5 ${getBadgeClass(currentLab.pco2 !== undefined && currentLab.pco2 > 50)}`}>
                <div className="text-[10px] font-sans text-slate-500">PCO2 (35-45)</div>
                <div className="text-sm font-bold mt-0.5">{currentLab.pco2 ?? '--'} <span className="text-[9px] font-normal">mmHg</span></div>
              </div>

              <div className={`p-2.5 ${getBadgeClass(currentLab.po2 !== undefined && currentLab.po2 < 60)}`}>
                <div className="text-[10px] font-sans text-slate-500">PO2 (80-100)</div>
                <div className="text-sm font-bold mt-0.5">{currentLab.po2 ?? '--'} <span className="text-[9px] font-normal">mmHg</span></div>
                {currentLab.po2 !== undefined && currentLab.po2 < 60 && (
                  <span className="text-[9px] font-sans text-rose-700 font-semibold block">Thiếu O2</span>
                )}
              </div>

              <div className={`p-2.5 ${getBadgeClass(currentLab.hco3 !== undefined && currentLab.hco3 < 18)}`}>
                <div className="text-[10px] font-sans text-slate-500">HCO3 (22-26)</div>
                <div className="text-sm font-bold mt-0.5">{currentLab.hco3 ?? '--'} <span className="text-[9px] font-normal">mmol/L</span></div>
              </div>

              <div className={`p-2.5 ${getBadgeClass(currentLab.sao2 !== undefined && currentLab.sao2 < 90)}`}>
                <div className="text-[10px] font-sans text-slate-500">SaO2 (95-100)</div>
                <div className="text-sm font-bold mt-0.5">{currentLab.sao2 ?? '--'} <span className="text-[9px] font-normal">%</span></div>
              </div>

              <div className={`p-2.5 ${getBadgeClass(currentLab.lactat !== undefined && currentLab.lactat > 4.0)}`}>
                <div className="text-[10px] font-sans text-slate-500">Lactat (0.5-1.6)</div>
                <div className="text-sm font-bold mt-0.5 text-rose-700">{currentLab.lactat ?? '--'} <span className="text-[9px] font-normal">mmol/L</span></div>
                {currentLab.lactat !== undefined && currentLab.lactat > 4.0 && (
                  <span className="text-[9px] font-sans text-rose-700 font-semibold block">Lactat cao</span>
                )}
              </div>

            </div>
          </div>

          {/* Row 2: Bạch Cầu & Nhiễm Khuẩn */}
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-100/90 px-3 py-1.5 text-[11px] font-sans font-bold text-slate-700 flex items-center justify-between border-b border-slate-200">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                2. BẠCH CẦU & CHỈ SỐ NHIỄM KHUẨN
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-200 bg-white">
              <div className={`p-2.5 ${getBadgeClass(currentLab.wbc !== undefined && (currentLab.wbc > 11 || currentLab.wbc < 4))}`}>
                <div className="text-[10px] font-sans text-slate-500">WBC (4.0-10.0 G/L)</div>
                <div className="text-sm font-bold mt-0.5">{currentLab.wbc ?? '--'}</div>
              </div>
              <div className="p-2.5 bg-white">
                <div className="text-[10px] font-sans text-slate-500">NEU (40-70%)</div>
                <div className="text-sm font-bold mt-0.5">{currentLab.neu ?? '--'}%</div>
              </div>
              <div className="p-2.5 bg-white">
                <div className="text-[10px] font-sans text-slate-500">LYM (20-40%)</div>
                <div className="text-sm font-bold mt-0.5">{currentLab.lym ?? '--'}%</div>
              </div>
              <div className={`p-2.5 ${getBadgeClass(currentLab.pct !== undefined && currentLab.pct > 0.5)}`}>
                <div className="text-[10px] font-sans text-slate-500">PCT Procalcitonin (&lt;0.05)</div>
                <div className="text-sm font-bold mt-0.5">{currentLab.pct ?? '--'} <span className="text-[9px] font-normal">ng/mL</span></div>
              </div>
            </div>
          </div>

          {/* Row 3: Hồng Cầu, Tiểu Cầu & Đông Máu (D-Dimer) */}
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-100/90 px-3 py-1.5 text-[11px] font-sans font-bold text-slate-700 flex items-center justify-between border-b border-slate-200">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                3. HUYẾT HỌC, ĐÔNG MÁU & D-DIMER
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-8 divide-x divide-y sm:divide-y-0 divide-slate-200 bg-white text-center">
              <div className="p-2">
                <div className="text-[10px] font-sans text-slate-500">HC (T/L)</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.hc ?? '--'}</div>
              </div>
              <div className={`p-2 ${getBadgeClass(currentLab.hb !== undefined && currentLab.hb < 10)}`}>
                <div className="text-[10px] font-sans text-slate-500">Hb (g/dL)</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.hb ?? '--'}</div>
              </div>
              <div className="p-2">
                <div className="text-[10px] font-sans text-slate-500">Hct (%)</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.hct ?? '--'}</div>
              </div>
              <div className={`p-2 ${getBadgeClass(currentLab.plt !== undefined && currentLab.plt < 100)}`}>
                <div className="text-[10px] font-sans text-slate-500">PLT (G/L)</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.plt ?? '--'}</div>
              </div>
              <div className={`p-2 ${getBadgeClass(currentLab.inr !== undefined && (currentLab.inr > 3.0 || currentLab.inr < 1.5))}`}>
                <div className="text-[10px] font-sans text-slate-500">INR</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.inr ?? '--'}</div>
              </div>
              <div className="p-2">
                <div className="text-[10px] font-sans text-slate-500">PT (%)</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.pt ?? '--'}</div>
              </div>
              <div className="p-2">
                <div className="text-[10px] font-sans text-slate-500">Aptt (s)</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.aptt ?? '--'}</div>
              </div>
              <div className={`p-2 ${getBadgeClass(currentLab.dimer !== undefined && currentLab.dimer > 1000)}`}>
                <div className="text-[10px] font-sans text-slate-500">D-Dimer (&lt;500)</div>
                <div className="text-xs font-bold mt-0.5 text-rose-700">{currentLab.dimer ?? '--'}</div>
                {currentLab.dimer !== undefined && currentLab.dimer > 5000 && (
                  <span className="text-[9px] font-sans text-rose-700 font-semibold block">Huyết khối cao</span>
                )}
              </div>
            </div>
          </div>

          {/* Row 4: Thận, Điện Giải & Đường Máu */}
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-100/90 px-3 py-1.5 text-[11px] font-sans font-bold text-slate-700 flex items-center justify-between border-b border-slate-200">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                4. CHỨC NĂNG THẬN, ĐIỆN GIẢI & ĐƯỜNG MÁU
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Đặc biệt quan trọng trong phòng ngừa xoắn đỉnh & rung thất</span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-9 divide-x divide-y sm:divide-y-0 divide-slate-200 bg-white text-center">
              <div className={`p-2 ${getBadgeClass(currentLab.ure !== undefined && currentLab.ure > 10)}`}>
                <div className="text-[10px] font-sans text-slate-500">Ure</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.ure ?? '--'}</div>
              </div>
              <div className={`p-2 ${getBadgeClass(currentLab.cre !== undefined && currentLab.cre > 140)}`}>
                <div className="text-[10px] font-sans text-slate-500">Cre (µmol/L)</div>
                <div className="text-xs font-bold mt-0.5 text-rose-700">{currentLab.cre ?? currentLab.creatinine ?? '--'}</div>
                {currentLab.cre !== undefined && currentLab.cre > 150 && (
                  <span className="text-[9px] font-sans text-rose-700 font-semibold block">Suy thận</span>
                )}
              </div>
              <div className="p-2">
                <div className="text-[10px] font-sans text-slate-500">CK (U/L)</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.ck ?? '--'}</div>
              </div>
              <div className="p-2">
                <div className="text-[10px] font-sans text-slate-500">Na+ (mmol/L)</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.na ?? '--'}</div>
              </div>
              <div className={`p-2 ${getBadgeClass(currentLab.k !== undefined && (currentLab.k < 3.5 || currentLab.k > 5.5))}`}>
                <div className="text-[10px] font-sans text-slate-500">K+ (3.5-5.0)</div>
                <div className="text-xs font-bold mt-0.5 text-rose-700">{currentLab.k ?? '--'}</div>
                {currentLab.k !== undefined && currentLab.k < 3.5 && (
                  <span className="text-[9px] font-sans text-rose-700 font-semibold block">Hạ Kali</span>
                )}
              </div>
              <div className="p-2">
                <div className="text-[10px] font-sans text-slate-500">Mg2+</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.mg ?? '--'}</div>
              </div>
              <div className="p-2">
                <div className="text-[10px] font-sans text-slate-500">Ca TP</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.ca ?? '--'}</div>
              </div>
              <div className="p-2">
                <div className="text-[10px] font-sans text-slate-500">Ca++ Ion</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.caIon ?? '--'}</div>
              </div>
              <div className={`p-2 ${getBadgeClass(currentLab.glu !== undefined && currentLab.glu > 11)}`}>
                <div className="text-[10px] font-sans text-slate-500">Glucose</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.glu ?? '--'}</div>
              </div>
            </div>
          </div>

          {/* Row 5: Chức Năng Gan & Protein */}
          <div className="rounded-lg border border-slate-200 overflow-hidden">
            <div className="bg-slate-100/90 px-3 py-1.5 text-[11px] font-sans font-bold text-slate-700 flex items-center justify-between border-b border-slate-200">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-500" />
                5. CHỨC NĂNG GAN & PROTEIN
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-6 divide-x divide-y sm:divide-y-0 divide-slate-200 bg-white text-center">
              <div className="p-2">
                <div className="text-[10px] font-sans text-slate-500">GOT / AST (&lt;40)</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.got ?? '--'}</div>
              </div>
              <div className="p-2">
                <div className="text-[10px] font-sans text-slate-500">GPT / ALT (&lt;40)</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.gpt ?? '--'}</div>
              </div>
              <div className="p-2">
                <div className="text-[10px] font-sans text-slate-500">Albumin (35-50)</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.alb ?? '--'}</div>
              </div>
              <div className="p-2">
                <div className="text-[10px] font-sans text-slate-500">Protein (60-80)</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.pro ?? '--'}</div>
              </div>
              <div className="p-2">
                <div className="text-[10px] font-sans text-slate-500">Bilirubin TP</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.biltp ?? '--'}</div>
              </div>
              <div className="p-2">
                <div className="text-[10px] font-sans text-slate-500">Bilirubin TT</div>
                <div className="text-xs font-bold mt-0.5">{currentLab.biltt ?? '--'}</div>
              </div>
            </div>
          </div>

          {/* Row 6: Dấu Ấn Sinh Học Tim Mạch (Cardiac Biomarkers) */}
          <div className="rounded-lg border border-rose-200 overflow-hidden bg-rose-50/30">
            <div className="bg-rose-100/90 px-3 py-1.5 text-[11px] font-sans font-bold text-rose-900 flex items-center justify-between border-b border-rose-200">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-600 animate-pulse" />
                6. DẤU ẤN TIM MẠCH (CARDIAC BIOMARKERS)
              </span>
              <span className="text-[10px] text-rose-700 font-sans font-semibold">Chẩn đoán hoại tử cơ tim & suy tim</span>
            </div>
            <div className="grid grid-cols-2 divide-x divide-slate-200 bg-white p-1">
              <div className={`p-3 ${getBadgeClass(currentLab.tpnThs !== undefined && currentLab.tpnThs > 14)}`}>
                <div className="text-[11px] font-sans text-slate-600 font-semibold flex items-center justify-between">
                  <span>TpnThs (Troponin T hs)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Chuẩn &lt; 14 ng/L</span>
                </div>
                <div className="text-lg font-bold text-rose-700 mt-1">{currentLab.tpnThs ?? currentLab.troponinI ?? '--'} <span className="text-xs font-normal">ng/L</span></div>
                {currentLab.tpnThs !== undefined && currentLab.tpnThs > 14 && (
                  <span className="text-[10px] font-sans text-rose-700 font-semibold mt-0.5 block">
                    Tăng cao: Hoại tử tế bào cơ tim cấp
                  </span>
                )}
              </div>

              <div className={`p-3 ${getBadgeClass(currentLab.bnp !== undefined && currentLab.bnp > 125)}`}>
                <div className="text-[11px] font-sans text-slate-600 font-semibold flex items-center justify-between">
                  <span>BNP / NT-proBNP</span>
                  <span className="text-[10px] text-slate-400 font-normal">Chuẩn &lt; 100 pg/mL</span>
                </div>
                <div className="text-lg font-bold text-slate-900 mt-1">{currentLab.bnp ?? '--'} <span className="text-xs font-normal">pg/mL</span></div>
                {currentLab.bnp !== undefined && currentLab.bnp > 125 && (
                  <span className="text-[10px] font-sans text-amber-700 font-semibold mt-0.5 block">
                    Tăng: Quá tải buồng thất / Suy tim
                  </span>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Quick Paste Modal */}
      {isPasteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-xl w-full border border-slate-200 shadow-2xl p-6 space-y-4 text-xs">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <ClipboardPaste className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Dán Chuỗi Kết Quả Xét Nghiệm Từ Viện
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bệnh nhân: {patient.fullName} ({patient.bedNumber})
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsPasteModalOpen(false)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleQuickPasteSubmit} className="space-y-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700">
                    Dán chuỗi kết quả (ngăn cách bởi dấu chấm phẩy hoặc dòng):
                  </label>
                  <button
                    type="button"
                    onClick={handleSampleFill}
                    className="text-sky-600 font-semibold hover:underline"
                  >
                    Dán mẫu thử nghiệm
                  </button>
                </div>
                <textarea
                  rows={6}
                  required
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  placeholder="Ví dụ: pH: 6.907; PCO2: 66.7; PO2: 32.1; HCO3: 13.4; SaO2: 30.1; Lactat: 12.84; WBC: 13.00; NEU: 46; HC: 4.67; Hb: 12.8; PLT: 189; INR: 1.05; Cre: 202.7; K: 4.28; TpnThs: 34.28; BNP: 552.3; ..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-mono text-[11px] focus:outline-none focus:ring-1 focus:ring-sky-500"
                />
              </div>

              <div className="p-3 bg-sky-50 rounded-lg border border-sky-200 text-sky-800 text-[11px]">
                Hệ thống tự động nhận diện tất cả các tên chỉ số viết tắt chuẩn (pH, PO2, WBC, Cre, K, TpnThs, BNP...) và điền chính xác vào 6 nhóm bảng xét nghiệm.
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPasteModalOpen(false)}
                  className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-lg shadow-xs"
                >
                  Phân Tích & Cập Nhật Vào Bảng
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
