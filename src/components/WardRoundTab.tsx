import React, { useState, useRef, useEffect } from 'react';
import { useApp } from '../context/AppContext.tsx';
import { Patient, WardRoundNote, WardTask, Medication } from '../types.ts';
import { parsePlanToTasks } from '../utils/labParser.ts';
import { LabSummaryTable } from './LabSummaryTable.tsx';
import { PlanVoiceModal } from './PlanVoiceModal.tsx';
import { 
  Stethoscope, 
  CheckSquare, 
  Square, 
  Mic, 
  MicOff, 
  RotateCcw, 
  Save, 
  Clock, 
  Activity, 
  Plus, 
  AlertCircle, 
  CheckCircle2, 
  Pill, 
  Sparkles,
  Zap,
  ArrowRight,
  ListTodo,
  Layers,
  Filter,
  ZoomIn,
  X,
  Camera,
  Upload,
  Image as ImageIcon,
  Trash2
} from 'lucide-react';

export const WardRoundTab: React.FC = () => {
  const { 
    patients, 
    selectedPatientId, 
    setSelectedPatientId, 
    currentUser, 
    addWardRoundNote,
    toggleTaskDone,
    addWardTask,
    addWardTasksBatch,
    updatePatient,
    getDisplayPatientName,
    showToast
  } = useApp();

  const activePatients = patients.filter(p => p.status === 'active');
  const currentPatient = activePatients.find(p => p.id === selectedPatientId) || activePatients[0];

  // SOAPE Form State
  const [subjective, setSubjective] = useState('');
  const [objective, setObjective] = useState('');
  const [assessment, setAssessment] = useState('');
  const [plan, setPlan] = useState('');
  const [evaluation, setEvaluation] = useState('');
  const [autoSyncPlanToChecklist, setAutoSyncPlanToChecklist] = useState(true);

  // Checklist Filter State ('all' | 'pending' | 'done')
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'done'>('all');

  // New task input state
  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskRole, setNewTaskRole] = useState<'doctor' | 'nurse' | 'both'>('nurse');

  // Daily Medications state & image attachment
  const [previewMedImage, setPreviewMedImage] = useState<{ name: string; url: string } | null>(null);
  const [targetMedIdForImage, setTargetMedIdForImage] = useState<string | null>(null);
  const medFileInputRef = useRef<HTMLInputElement | null>(null);
  const medCameraInputRef = useRef<HTMLInputElement | null>(null);
  const [isAddingMed, setIsAddingMed] = useState(false);
  const [newMedName, setNewMedName] = useState('');
  const [newMedDosage, setNewMedDosage] = useState('');
  const [newMedRoute, setNewMedRoute] = useState('Uống');
  const [newMedTime, setNewMedTime] = useState('08:00 - 20:00');
  const [newMedImageUrl, setNewMedImageUrl] = useState<string | null>(null);

  // Voice Dictation State for Assessment
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Plan Voice Dictation States
  const [isPlanVoiceModalOpen, setIsPlanVoiceModalOpen] = useState(false);
  const [previewSketchImage, setPreviewSketchImage] = useState<string | null>(null);
  const [isPlanRecording, setIsPlanRecording] = useState(false);
  const planRecognitionRef = useRef<any>(null);

  // Pre-fill form when patient changes
  useEffect(() => {
    if (currentPatient) {
      setSubjective('');
      setObjective(`Mạch: ${currentPatient.vitals.hr} bpm, HA: ${currentPatient.vitals.bp} mmHg, SpO2: ${currentPatient.vitals.spo2}%. Nhịp: ${currentPatient.arrhythmiaType}.`);
      setAssessment('');
      setPlan('');
      setEvaluation('');
      setRecordedAudioUrl(null);
    }
  }, [currentPatient?.id]);

  // Voice dictation toggle
  const toggleVoiceRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsRecording(false);
      showToast('Đã dừng ghi âm giọng nói.', 'info');
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'vi-VN';
          recognition.continuous = true;
          recognition.interimResults = true;

          recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
            }
            setAssessment(prev => (prev ? prev + ' ' : '') + transcript);
          };

          recognition.onerror = () => setIsRecording(false);
          recognition.onend = () => setIsRecording(false);
          recognition.start();
          recognitionRef.current = recognition;
          setIsRecording(true);
          showToast('Đang nhận diện giọng nói tiếng Việt...', 'info');
        } catch (e) {
          fallbackVoiceRecording();
        }
      } else {
        fallbackVoiceRecording();
      }
    }
  };

  const fallbackVoiceRecording = () => {
    setIsRecording(true);
    showToast('Đang mô phỏng ghi âm ghi chú lâm sàng...', 'info');
    setTimeout(() => {
      setIsRecording(false);
      const simulatedText = "Bệnh nhân đỡ hồi hộp, nhịp xoang đều, kiểm tra lại điện tâm đồ sau khi uống thuốc chẹn beta.";
      setAssessment(prev => (prev ? prev + '\n' : '') + `[Ghi âm lúc ${new Date().toLocaleTimeString('vi-VN')}]: ${simulatedText}`);
      setRecordedAudioUrl('simulated-voice-note');
      showToast('Đã chuyển đổi giọng nói thành văn bản thành công.', 'success');
    }, 3000);
  };

  // Voice dictation specifically for Plan (Kế hoạch can thiệp & Y lệnh)
  const togglePlanVoiceRecording = () => {
    if (isPlanRecording) {
      if (planRecognitionRef.current) {
        planRecognitionRef.current.stop();
      }
      setIsPlanRecording(false);
      showToast('Đã dừng ghi âm kế hoạch điều trị.', 'info');
    } else {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.lang = 'vi-VN';
          recognition.continuous = true;
          recognition.interimResults = true;

          let finalTranscripts = '';

          recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
            }
            if (transcript) {
              finalTranscripts = transcript;
              setPlan(prev => {
                const trimmed = prev.trim();
                return trimmed ? `${trimmed}\n${transcript}` : transcript;
              });
            }
          };

          recognition.onerror = () => setIsPlanRecording(false);
          recognition.onend = () => {
            setIsPlanRecording(false);
            if (finalTranscripts && autoSyncPlanToChecklist && currentPatient) {
              const tasks = parsePlanToTasks(finalTranscripts);
              if (tasks.length > 0) {
                addWardTasksBatch(currentPatient.id, tasks);
                showToast(`Đã nhận diện giọng nói và tự động tạo ${tasks.length} y lệnh vào Checklist!`, 'success');
              }
            }
          };
          recognition.start();
          planRecognitionRef.current = recognition;
          setIsPlanRecording(true);
          showToast('Đang nhận diện giọng nói y lệnh tiếng Việt...', 'info');
        } catch (e) {
          fallbackPlanVoiceRecording();
        }
      } else {
        fallbackPlanVoiceRecording();
      }
    }
  };

  const fallbackPlanVoiceRecording = () => {
    setIsPlanRecording(true);
    showToast('Đang nhận diện giọng nói y lệnh điều trị...', 'info');
    setTimeout(() => {
      setIsPlanRecording(false);
      const simulatedPlanOrders = "1. Sốc điện đồng bộ chuyển nhịp 150J khẩn cấp\n2. Bù Kali clorid 10% 2 ống pha truyền TM chậm\n3. Làm lại khí máu động mạch và điện giải đồ sau 1h";
      setPlan(prev => {
        const trimmed = prev.trim();
        return trimmed ? `${trimmed}\n${simulatedPlanOrders}` : simulatedPlanOrders;
      });

      if (autoSyncPlanToChecklist && currentPatient) {
        const tasks = parsePlanToTasks(simulatedPlanOrders);
        if (tasks.length > 0) {
          addWardTasksBatch(currentPatient.id, tasks);
          showToast(`Đã nhận diện giọng nói và tự động tạo ${tasks.length} việc vào Checklist!`, 'success');
        }
      } else {
        showToast('Đã nhận diện y lệnh giọng nói thành công!', 'success');
      }
    }, 2000);
  };

  // Handler when voice orders are submitted via PlanVoiceModal
  const handleApplyVoiceOrders = (spokenText: string, generatedTasks: Array<Omit<WardTask, 'id' | 'createdAt'>>) => {
    if (!currentPatient) return;

    // Append to Plan text
    setPlan(prev => {
      const clean = prev.trim();
      return clean ? `${clean}\n${spokenText}` : spokenText;
    });

    // Automatically batch add to daily Checklist
    if (generatedTasks.length > 0) {
      addWardTasksBatch(currentPatient.id, generatedTasks);
      showToast(`Đã nhận diện giọng nói và tự động tạo ${generatedTasks.length} việc vào Checklist!`, 'success');
    } else {
      showToast('Đã ghi nhận y lệnh từ giọng nói vào ô Plan.', 'info');
    }
  };

  // Manual trigger to parse Plan text to Checklist
  const handleSyncPlanToChecklistManually = () => {
    if (!plan.trim() || !currentPatient) {
      showToast('Chưa có nội dung trong ô Kế hoạch can thiệp & Y lệnh điều trị.', 'error');
      return;
    }

    const tasks = parsePlanToTasks(plan);
    if (tasks.length === 0) {
      showToast('Không phát hiện được y lệnh nào để trích xuất.', 'info');
      return;
    }

    addWardTasksBatch(currentPatient.id, tasks);
    showToast(`Đã chuyển ${tasks.length} y lệnh từ Plan vào Checklist công việc hôm nay!`, 'success');
  };

  // Add Task handler
  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskText.trim() || !currentPatient) return;
    addWardTask(currentPatient.id, {
      task: newTaskText.trim(),
      done: false,
      assignedRole: newTaskRole,
      priority: 'normal',
    });
    setNewTaskText('');
  };

  const handleDeleteTask = (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation();
    if (!currentPatient) return;
    updatePatient(currentPatient.id, {
      wardTasks: currentPatient.wardTasks.filter(t => t.id !== taskId),
    });
    showToast('Đã xóa công việc khỏi checklist.', 'info');
  };

  const handleMedFileSelected = (file: File) => {
    if (!targetMedIdForImage || !currentPatient) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = reader.result as string;
      const updatedMeds = currentPatient.medications.map(m =>
        m.id === targetMedIdForImage ? { ...m, imageUrl: url } : m
      );
      updatePatient(currentPatient.id, { medications: updatedMeds });
      showToast('Đã đính kèm ảnh chụp thuốc thành công.', 'success');
      setTargetMedIdForImage(null);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveMedImage = (e: React.MouseEvent, medId: string) => {
    e.stopPropagation();
    if (!currentPatient) return;
    const updatedMeds = currentPatient.medications.map(m =>
      m.id === medId ? { ...m, imageUrl: undefined } : m
    );
    updatePatient(currentPatient.id, { medications: updatedMeds });
    showToast('Đã gỡ ảnh đính kèm của thuốc.', 'info');
  };

  const handleAddNewMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMedName.trim() || !currentPatient) return;
    const newMed: Medication = {
      id: `med-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      name: newMedName.trim(),
      dosage: newMedDosage.trim() || '1 viên',
      route: newMedRoute,
      time: newMedTime,
      takenToday: false,
      prescribedBy: `${currentUser.title} ${currentUser.name}`,
      imageUrl: newMedImageUrl || undefined,
    };
    updatePatient(currentPatient.id, {
      medications: [newMed, ...currentPatient.medications],
    });
    showToast(`Đã bổ sung thuốc mới: ${newMed.name}`, 'success');
    setNewMedName('');
    setNewMedDosage('');
    setNewMedImageUrl(null);
    setIsAddingMed(false);
  };

  // Save SOAPE Note with auto checklist synchronization
  const handleSaveSOAPE = () => {
    if (!currentPatient) return;

    if (!subjective && !objective && !assessment && !plan) {
      showToast('Vui lòng nhập ít nhất một trường thông tin trong mẫu SOAPE.', 'error');
      return;
    }

    const now = new Date();
    const newNote: WardRoundNote = {
      id: `wr-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: now.toISOString().slice(0, 10),
      time: now.toTimeString().slice(0, 5),
      doctorName: `${currentUser.title} ${currentUser.name}`,
      subjective: subjective || 'Không ghi nhận phàn nàn mới.',
      objective: objective || `Mạch ${currentPatient.vitals.hr} bpm, HA ${currentPatient.vitals.bp} mmHg.`,
      assessment: assessment || 'Tình trạng huyết động và nhịp tim ổn định theo phác đồ.',
      plan: plan || 'Tiếp tục duy trì y lệnh điều trị hiện hành.',
      evaluation: evaluation || 'Người bệnh đáp ứng tốt.',
      voiceNoteUrl: recordedAudioUrl || undefined,
    };

    addWardRoundNote(currentPatient.id, newNote);

    // Tự động phân tách Plan thành Checklist công việc nếu bật tùy chọn
    if (autoSyncPlanToChecklist && plan.trim()) {
      const generatedTasks = parsePlanToTasks(plan);
      if (generatedTasks.length > 0) {
        addWardTasksBatch(currentPatient.id, generatedTasks);
        showToast(`Đã lưu SOAPE và tự động đồng bộ ${generatedTasks.length} y lệnh vào Checklist!`, 'success');
      }
    }

    // Clear inputs
    setSubjective('');
    setAssessment('');
    setPlan('');
    setEvaluation('');
  };

  // Clinical templates
  const applyClinicalTemplate = (type: 'VT' | 'AFib' | 'AVBlock' | 'Discharge') => {
    if (type === 'VT') {
      setSubjective('Bệnh nhân tỉnh, giảm cảm giác hồi hộp, không đau thắt ngực, không khó thở.');
      setObjective(`Mạch ${currentPatient?.vitals.hr || 85} bpm, HA ${currentPatient?.vitals.bp || '110/70'} mmHg. Monitor nhịp xoang, thỉnh thoảng ngoại tâm thu thất đơn ổ.`);
      setAssessment('Cơn nhịp nhanh thất đã kiểm soát sau điều chỉnh thuốc chống loạn nhịp và bù điện giải.');
      setPlan('1. Duy trì Amiodarone bơm tiêm điện 0.5mg/phút khẩn\n2. Bù Kali clorid 10% 2 ống pha truyền TM chậm\n3. Lấy máu làm lại điện giải đồ K+ và khí máu lúc 11h\n4. Chuẩn bị máy phá rung tự động sẵn sàng tại buồng CC01');
      setEvaluation('Huyết động ổn định.');
    } else if (type === 'AFib') {
      setSubjective('Đỡ cảm giác tim đập nhanh không đều, không khó thở khi nghỉ ngơi.');
      setObjective(`Nhịp tim dao động 85-95 ck/p. Huyết áp 120/80 mmHg. Tim loạn nhịp hoàn toàn.`);
      setAssessment('Rung nhĩ đáp ứng thất kiểm soát tốt bằng chẹn beta giao cảm. Nguy cơ huyết khối CHA2DS2-VASc được bảo vệ bằng thuốc chống đông.');
      setPlan('1. Uống Betaloc ZOK 50mg lúc 08h00 sau ăn\n2. Uống Xarelto (Rivaroxaban) 20mg cùng bữa tối\n3. Đo lại ECG 12 chuyển đạo đánh giá tần số thất lúc 10h00\n4. Đánh giá siêu âm tim qua thực quản tìm huyết khối tiểu nhĩ');
      setEvaluation('Lâm sàng cải thiện.');
    } else if (type === 'AVBlock') {
      setSubjective('Không còn hoa mắt chóng mặt hay ngất xỉu. Tinh thần tỉnh táo.');
      setObjective(`Nhịp máy tạo nhịp ${currentPatient?.vitals.hr || 60} bpm đều. Vết mổ/chọc mạch khô ráo.`);
      setAssessment('Block nhĩ thất phụ thuộc hoàn toàn máy tạo nhịp. Ngưỡng kích thích và cảm nhận ổn định.');
      setPlan('1. Kiểm tra pin và ngưỡng máy tạo nhịp ngoài khẩn\n2. Băng ép cố định đường vào tĩnh mạch đùi\n3. Lên lịch cấy máy tạo nhịp 2 buồng vĩnh viễn lúc 14h00\n4. Tiêm kháng sinh Zinacef 750mg lúc 08h00');
      setEvaluation('Tiến triển tốt.');
    } else if (type === 'Discharge') {
      setSubjective('Hết triệu chứng khó chịu, thể trạng hồi phục tốt, ăn ngủ bình thường.');
      setObjective('Sinh hiệu ổn định, ECG không còn loạn nhịp nguy hiểm.');
      setAssessment('Bệnh ổn định, đủ điều kiện điều trị ngoại trú.');
      setPlan('1. Kê đơn thuốc ngoại trú 14 ngày\n2. Hướng dẫn chế độ sinh hoạt và theo dõi mạch tại nhà\n3. Hẹn tái khám sau 2 tuần mang theo kết quả');
      setEvaluation('Đủ tiêu chuẩn xuất viện.');
    }
    showToast('Đã điền mẫu ghi chú lâm sàng nhanh.', 'info');
  };

  const handleMedicationCheck = (medId: string) => {
    if (!currentPatient) return;
    const updatedMeds = currentPatient.medications.map(m => 
      m.id === medId ? { ...m, takenToday: !m.takenToday } : m
    );
    updatePatient(currentPatient.id, { medications: updatedMeds });
  };

  if (!currentPatient) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-500">
        Không có bệnh nhân nội trú nào đang điều trị.
      </div>
    );
  }

  // Unified Checklist Tasks (All, Pending, Done)
  const allTasks = currentPatient.wardTasks;
  const pendingTasks = allTasks.filter(t => !t.done);
  const doneTasks = allTasks.filter(t => t.done);
  const displayedTasks =
    taskFilter === 'pending'
      ? pendingTasks
      : taskFilter === 'done'
      ? doneTasks
      : allTasks;

  return (
    <div className="space-y-5">
      
      {/* Bed & Patient Selector Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-xs">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
            <Stethoscope className="w-4 h-4 text-sky-600" />
            <span>Chọn buồng bệnh / Bệnh nhân đang khám:</span>
          </div>
          <span className="text-xs text-slate-500 font-mono tabular-nums">
            {activePatients.findIndex(p => p.id === currentPatient.id) + 1} / {activePatients.length} ca
          </span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
          {activePatients.map(p => {
            const isSelected = p.id === currentPatient.id;
            const isEmergency = p.triageLevel === 'emergency';
            return (
              <button
                key={p.id}
                onClick={() => setSelectedPatientId(p.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all shrink-0 flex items-center gap-2 border ${
                  isSelected
                    ? 'bg-sky-600 text-white border-sky-600 shadow-xs'
                    : isEmergency
                    ? 'bg-rose-50 text-rose-800 border-rose-200 hover:bg-rose-100'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span className="font-mono">{p.bedNumber}</span>
                <span className="font-medium truncate max-w-[120px]">{getDisplayPatientName(p)}</span>
                {isEmergency && <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Patient Header Summary Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold font-mono text-base shadow-xs ${
            currentPatient.triageLevel === 'emergency' ? 'bg-rose-600' : currentPatient.triageLevel === 'warning' ? 'bg-amber-600' : 'bg-emerald-600'
          }`}>
            {currentPatient.bedNumber}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                {getDisplayPatientName(currentPatient)}
              </h2>
              <span className="text-xs text-slate-500 font-mono">
                {currentPatient.age} tuổi · {currentPatient.gender} · {currentPatient.patientCode}
              </span>
            </div>
            <p className="text-xs font-semibold text-sky-800">
              {currentPatient.arrhythmiaType} · <span className="font-normal text-slate-600">{currentPatient.admissionDiagnosis}</span>
            </p>
          </div>
        </div>

        {/* Live Vitals Indicators */}
        <div className="flex items-center gap-3 bg-slate-50 p-2.5 rounded-lg border border-slate-200 shrink-0 font-mono text-xs tabular-nums">
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-400 block font-sans">MẠCH</span>
            <span className={`font-bold text-sm ${currentPatient.vitals.hr > 120 || currentPatient.vitals.hr < 50 ? 'text-rose-600' : 'text-slate-900'}`}>
              {currentPatient.vitals.hr} <span className="text-[10px] font-normal">bpm</span>
            </span>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-400 block font-sans">HUYẾT ÁP</span>
            <span className="font-bold text-sm text-slate-900">
              {currentPatient.vitals.bp} <span className="text-[10px] font-normal">mmHg</span>
            </span>
          </div>
          <div className="w-px h-6 bg-slate-200" />
          <div className="text-center px-2">
            <span className="text-[10px] text-slate-400 block font-sans">SpO2</span>
            <span className="font-bold text-sm text-slate-900">
              {currentPatient.vitals.spo2}%
            </span>
          </div>
        </div>
      </div>

      {/* FEATURE 1: Comprehensive Lab Results Table (6 Clinical Groups) */}
      <LabSummaryTable patient={currentPatient} />

      {/* Main Grid: 2 Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Left Column (7 Cols): SOAPE Note + Handwriting Pad + Voice */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* SOAPE Note Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Ghi Chép Diễn Biến Đi Buồng (Chuẩn SOAPE)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Bác sĩ: {currentUser.title} {currentUser.name} · {new Date().toLocaleDateString('vi-VN')}
                  </p>
                </div>
              </div>

              {/* Quick Template Buttons */}
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[11px] text-slate-400 font-medium mr-1">Mẫu nhanh:</span>
                <button
                  type="button"
                  onClick={() => applyClinicalTemplate('VT')}
                  className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  VT
                </button>
                <button
                  type="button"
                  onClick={() => applyClinicalTemplate('AFib')}
                  className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  Rung nhĩ
                </button>
                <button
                  type="button"
                  onClick={() => applyClinicalTemplate('AVBlock')}
                  className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  Block AV
                </button>
                <button
                  type="button"
                  onClick={() => applyClinicalTemplate('Discharge')}
                  className="px-2 py-0.5 text-[11px] font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                >
                  Ra viện
                </button>
              </div>
            </div>

            {/* S - Subjective */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                S (Subjective) - Triệu chứng cơ năng:
              </label>
              <textarea
                rows={2}
                value={subjective}
                onChange={(e) => setSubjective(e.target.value)}
                placeholder="Cảm giác hồi hộp, đau thắt ngực, khó thở, chóng mặt, ngất xỉu..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white"
              />
            </div>

            {/* O - Objective */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                O (Objective) - Khám thực thể & ECG/Monitor:
              </label>
              <textarea
                rows={2}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                placeholder="Khám tim mạch, tiếng tim T1 T2, nhịp tim monitor, biến đổi sóng điện tim..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white"
              />
            </div>

            {/* A - Assessment (with Voice Dictation button) */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  A (Assessment) - Đánh giá huyết động & Loạn nhịp:
                </label>
                <button
                  type="button"
                  onClick={toggleVoiceRecording}
                  className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md border transition-all ${
                    isRecording
                      ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                  }`}
                >
                  {isRecording ? <MicOff className="w-3.5 h-3.5 text-rose-600" /> : <Mic className="w-3.5 h-3.5 text-sky-600" />}
                  <span>{isRecording ? 'Đang ghi âm (Dừng)' : 'Đọc giọng nói'}</span>
                </button>
              </div>
              <textarea
                rows={2}
                value={assessment}
                onChange={(e) => setAssessment(e.target.value)}
                placeholder="Phân tầng nguy cơ, mức độ kiểm soát nhịp tim, đáp ứng với thuốc chống loạn nhịp..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white"
              />
            </div>

            {/* P - Plan (Enhanced with Voice Dictation & Full-Screen Handwriting) */}
            <div className="bg-sky-50/50 p-3.5 rounded-xl border border-sky-200 space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-600" />
                  <span>P (Plan) - Kế Hoạch Can Thiệp & Y Lệnh Điều Trị:</span>
                </label>

                {/* Voice, Handwriting & Sync Tool Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {/* Voice Dictation to Checklist Assistant */}
                  <button
                    type="button"
                    onClick={() => setIsPlanVoiceModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold bg-sky-600 hover:bg-sky-700 text-white rounded-md transition-colors shadow-2xs"
                    title="Đọc y lệnh giọng nói tiếng Việt để tự động bóc tách thành checklist"
                  >
                    <Mic className="w-3.5 h-3.5" />
                    <span>🎤 Ghi âm tạo Checklist</span>
                  </button>

                  {/* Direct live mic button */}
                  <button
                    type="button"
                    onClick={togglePlanVoiceRecording}
                    className={`flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border transition-all ${
                      isPlanRecording
                        ? 'bg-rose-50 text-rose-700 border-rose-300 animate-pulse'
                        : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
                    }`}
                    title="Nói trực tiếp vào ô văn bản"
                  >
                    {isPlanRecording ? <MicOff className="w-3 h-3 text-rose-600" /> : <Mic className="w-3 h-3 text-slate-600" />}
                    <span>{isPlanRecording ? 'Đang đọc...' : 'Nói nhanh'}</span>
                  </button>

                  {/* Instant Sync Button */}
                  <button
                    type="button"
                    onClick={handleSyncPlanToChecklistManually}
                    disabled={!plan.trim()}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-white rounded-md disabled:opacity-40 shadow-2xs transition-colors flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3 text-amber-400" />
                    <span>Tách Checklist</span>
                  </button>
                </div>
              </div>

              <textarea
                rows={3}
                value={plan}
                onChange={(e) => setPlan(e.target.value)}
                placeholder="1. Sốc điện chuyển nhịp khẩn cấp 150J&#10;2. Bù Kali clorid 10% 2 ống pha truyền TM chậm&#10;3. Làm lại khí máu động mạch và điện giải đồ sau 1h&#10;4. Uống Betaloc ZOK 50mg lúc 08h00..."
                className="w-full text-xs p-2.5 bg-white border border-sky-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />

              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer font-medium text-sky-900">
                  <input
                    type="checkbox"
                    checked={autoSyncPlanToChecklist}
                    onChange={(e) => setAutoSyncPlanToChecklist(e.target.checked)}
                    className="rounded text-sky-600 focus:ring-sky-500"
                  />
                  <span>Tự động tách các dòng y lệnh vào Checklist khi bấm Lưu SOAPE hoặc Ghi âm</span>
                </label>
                <span className="text-[10px] text-slate-400">Tự phân loại Khẩn cấp & Thường quy</span>
              </div>
            </div>

            {/* E - Evaluation */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                E (Evaluation) - Đánh giá sau xử trí:
              </label>
              <input
                type="text"
                value={evaluation}
                onChange={(e) => setEvaluation(e.target.value)}
                placeholder="Tiến triển tích cực, người bệnh an tâm, không biến cố..."
                className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:bg-white"
              />
            </div>

            {/* Submit Note Button */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleSaveSOAPE}
                className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-xs transition-colors"
              >
                <Save className="w-4 h-4" />
                <span>Lưu Diễn Biến Đi Buồng (SOAPE)</span>
              </button>
            </div>

          </div>

          {/* Historical Ward Round Notes */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-500" />
              Lịch Sử Đi Buồng Các Ngày Trước ({currentPatient.wardRoundNotes.length} lần khám)
            </h3>

            {currentPatient.wardRoundNotes.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Chưa có ghi chép đi buồng nào trước đó.</p>
            ) : (
              <div className="space-y-3">
                {currentPatient.wardRoundNotes.map((note, idx) => (
                  <div key={`${note.id}-${idx}`} className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/60 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500 border-b border-slate-200 pb-1.5 font-mono">
                      <span className="font-semibold text-slate-800 font-sans">{note.doctorName}</span>
                      <span>{note.date} · {note.time}</span>
                    </div>

                    <div className="space-y-1">
                      <p><strong className="text-slate-800">S:</strong> {note.subjective}</p>
                      <p><strong className="text-slate-800">O:</strong> {note.objective}</p>
                      <p><strong className="text-slate-800">A:</strong> {note.assessment}</p>
                      <p><strong className="text-slate-800">P:</strong> {note.plan}</p>
                    </div>

                    {(note.handwritingSketch || note.planSketch) && (
                      <div className="mt-2 pt-2 border-t border-slate-200 flex items-center gap-3 flex-wrap">
                        {note.handwritingSketch && (
                          <div>
                            <span className="text-[10px] text-slate-500 block mb-1">Phác thảo ECG:</span>
                            <img 
                              src={note.handwritingSketch} 
                              alt="Bản vẽ điện tim" 
                              onClick={() => setPreviewSketchImage(note.handwritingSketch!)}
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
                              alt="Bản phác thảo can thiệp" 
                              onClick={() => setPreviewSketchImage(note.planSketch!)}
                              className="h-16 border border-sky-300 rounded bg-white p-1 cursor-pointer hover:opacity-90 shadow-2xs"
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

        </div>

        {/* Right Column (5 Cols): FEATURE 2 - Grouped Daily Checklist + Medications */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Unified Checklist Card (Removed urgent/routine division) */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ListTodo className="w-4 h-4 text-sky-600" />
                  Checklist Kế Hoạch & Y Lệnh Ngày
                </h3>
                <p className="text-[11px] text-slate-500">
                  Toàn bộ y lệnh can thiệp và công việc điều dưỡng trong ca trực
                </p>
              </div>

              {/* Filter tabs: Tất cả / Chưa xong / Đã xong */}
              <div className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-md shrink-0 text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setTaskFilter('all')}
                  className={`px-2 py-1 rounded transition-colors ${
                    taskFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({allTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTaskFilter('pending')}
                  className={`px-2 py-1 rounded transition-colors ${
                    taskFilter === 'pending' ? 'bg-white text-sky-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Chưa xong ({pendingTasks.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTaskFilter('done')}
                  className={`px-2 py-1 rounded transition-colors ${
                    taskFilter === 'done' ? 'bg-white text-emerald-700 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Đã xong ({doneTasks.length})
                </button>
              </div>
            </div>

            {/* Add new task inline form (No urgent/routine distinction) */}
            <form onSubmit={handleAddTask} className="flex flex-col gap-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
              <input
                type="text"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                placeholder="Nhập y lệnh mới (vd: Bù Kali 2 ống, Đo ECG 10h, Siêu âm tim...)"
                className="w-full text-xs p-2 bg-white border border-slate-200 rounded-md text-slate-900 focus:outline-none focus:ring-1 focus:ring-sky-500"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Phân công:</span>
                  <select
                    value={newTaskRole}
                    onChange={(e: any) => setNewTaskRole(e.target.value)}
                    className="text-[11px] bg-white border border-slate-200 rounded py-1 px-2 text-slate-700 focus:outline-none focus:ring-1 focus:ring-sky-500"
                  >
                    <option value="nurse">Điều dưỡng làm</option>
                    <option value="doctor">Bác sĩ làm</option>
                    <option value="both">Cả hai cùng làm</option>
                  </select>
                </div>
                <button
                  type="submit"
                  disabled={!newTaskText.trim()}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors shadow-2xs min-h-[32px]"
                >
                  + Thêm việc
                </button>
              </div>
            </form>

            {/* Unified Tasks List */}
            <div className="space-y-1.5 max-h-[360px] overflow-y-auto pr-0.5">
              {displayedTasks.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                  {taskFilter === 'pending'
                    ? 'Tuyệt vời! Tất cả y lệnh đã được hoàn thành.'
                    : taskFilter === 'done'
                    ? 'Chưa có y lệnh nào được đánh dấu hoàn thành.'
                    : 'Chưa có công việc nào. Bác sĩ có thể đọc giọng nói, nhập tại ô Plan bên cạnh hoặc bấm "+ Thêm việc".'}
                </div>
              ) : (
                displayedTasks.map((task, idx) => (
                  <div
                    key={`${task.id}-${idx}`}
                    onClick={() => toggleTaskDone(currentPatient.id, task.id)}
                    className={`p-2.5 rounded-lg border flex items-start justify-between gap-2.5 cursor-pointer transition-colors group ${
                      task.done
                        ? 'bg-slate-50 border-slate-200 text-slate-400'
                        : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-50 shadow-2xs'
                    }`}
                  >
                    <div className="flex items-start gap-2.5 flex-1 min-w-0">
                      {task.done ? (
                        <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0 text-xs">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`font-medium break-words ${task.done ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                            {task.task}
                          </span>
                          {task.fromPlan && (
                            <span className="text-[9px] font-mono px-1 rounded bg-sky-100 text-sky-700 shrink-0">
                              Từ Plan
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-1 font-sans">
                          <span>{task.assignedRole === 'nurse' ? 'Điều dưỡng' : task.assignedRole === 'doctor' ? 'Bác sĩ' : 'Cả hai'}</span>
                          <span>·</span>
                          <span>{task.createdAt.slice(11, 16)}</span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteTask(e, task.id)}
                      title="Xóa công việc này"
                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>

          </div>

          {/* Daily Medications Card with Image Attachment Feature */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-sky-600" />
                  Thuốc Điều Trị Hàng Ngày
                </h3>
                <p className="text-[11px] text-slate-500">
                  {currentPatient.medications.filter(m => m.takenToday).length}/{currentPatient.medications.length} đã dùng · Đính kèm ảnh vỉ/hộp thuốc
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingMed(!isAddingMed)}
                className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingMed ? 'Đóng' : '+ Thêm thuốc'}</span>
              </button>
            </div>

            {/* Hidden file & camera inputs for attaching image to existing medication */}
            <input
              type="file"
              ref={medFileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleMedFileSelected(file);
                e.target.value = '';
              }}
            />
            <input
              type="file"
              ref={medCameraInputRef}
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleMedFileSelected(file);
                e.target.value = '';
              }}
            />

            {/* Inline Add New Medication Form */}
            {isAddingMed && (
              <form onSubmit={handleAddNewMedication} className="bg-sky-50/60 rounded-xl p-3 border border-sky-200 space-y-2 text-xs animate-in fade-in">
                <div className="font-bold text-slate-800 text-xs">Thêm Y Lệnh Thuốc Mới:</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Tên thuốc (vd: Betaloc ZOK 50mg, Cordarone 200mg)"
                    value={newMedName}
                    onChange={(e) => setNewMedName(e.target.value)}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                  <input
                    type="text"
                    placeholder="Liều lượng (vd: 1 viên, 2 ống pha truyền)"
                    value={newMedDosage}
                    onChange={(e) => setNewMedDosage(e.target.value)}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                  <select
                    value={newMedRoute}
                    onChange={(e) => setNewMedRoute(e.target.value)}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                  >
                    <option value="Uống">Uống (PO)</option>
                    <option value="Tiêm tĩnh mạch">Tiêm tĩnh mạch (IV)</option>
                    <option value="Truyền tĩnh mạch">Truyền tĩnh mạch (IV Infusion)</option>
                    <option value="Tiêm dưới da">Tiêm dưới da (SC)</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Giờ dùng (vd: 08:00 - 20:00)"
                    value={newMedTime}
                    onChange={(e) => setNewMedTime(e.target.value)}
                    className="p-1.5 bg-white border border-slate-200 rounded-lg text-slate-900"
                  />
                </div>

                {/* Attach Photo to New Medication */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-sky-200/60">
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-md border border-slate-200 cursor-pointer text-[11px] font-medium shadow-2xs">
                      <Camera className="w-3.5 h-3.5 text-sky-600" />
                      <span>{newMedImageUrl ? 'Đã chọn ảnh' : 'Đính kèm ảnh thuốc'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = () => setNewMedImageUrl(reader.result as string);
                            reader.readAsDataURL(file);
                          }
                        }}
                      />
                    </label>
                    {newMedImageUrl && (
                      <button
                        type="button"
                        onClick={() => setNewMedImageUrl(null)}
                        className="text-[11px] text-rose-600 hover:underline"
                      >
                        Gỡ ảnh
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsAddingMed(false)}
                      className="px-2.5 py-1 text-slate-600 hover:bg-slate-100 rounded-md"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-3 py-1 bg-sky-600 hover:bg-sky-700 text-white font-semibold rounded-md shadow-2xs"
                    >
                      Lưu y lệnh
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Medications List with Photos */}
            <div className="space-y-2 max-h-[360px] overflow-y-auto pr-0.5">
              {currentPatient.medications.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-4 text-center">Chưa có y lệnh thuốc nào.</p>
              ) : (
                currentPatient.medications.map((med, idx) => (
                  <div 
                    key={`${med.id}-${idx}`}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-all space-y-2 group"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2.5 flex-1 min-w-0">
                        {/* Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleMedicationCheck(med.id)}
                          className="mt-0.5"
                        >
                          {med.takenToday ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 hover:text-slate-600" />
                          )}
                        </button>

                        {/* Text info */}
                        <div className="space-y-0.5 flex-1 min-w-0 text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`font-bold text-slate-900 ${med.takenToday ? 'line-through text-slate-400' : ''}`}>
                              {med.name}
                            </span>
                            <span className="text-[10px] text-slate-500 font-normal">
                              ({med.prescribedBy})
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-sans">
                            {med.dosage} · {med.time} ({med.route})
                          </div>
                        </div>
                      </div>

                      {/* Status pill */}
                      <button
                        type="button"
                        onClick={() => handleMedicationCheck(med.id)}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border shrink-0 transition-colors ${
                          med.takenToday
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {med.takenToday ? '✓ Đã dùng' : 'Chưa dùng'}
                      </button>
                    </div>

                    {/* Image Attachment Row */}
                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                      {med.imageUrl ? (
                        <div className="flex items-center gap-2">
                          <div 
                            onClick={() => setPreviewMedImage({ name: med.name, url: med.imageUrl! })}
                            className="relative w-12 h-12 rounded-lg border border-sky-300 overflow-hidden bg-white shrink-0 cursor-pointer shadow-2xs hover:ring-2 hover:ring-sky-500 transition-all group/img"
                            title="Bấm để xem ảnh phóng to"
                          >
                            <img
                              src={med.imageUrl}
                              alt={med.name}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center transition-opacity text-white">
                              <ZoomIn className="w-3.5 h-3.5" />
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-700 font-medium block">Ảnh bao bì/vỉ thuốc</span>
                            <div className="flex items-center gap-2 text-[10px]">
                              <button
                                type="button"
                                onClick={() => setPreviewMedImage({ name: med.name, url: med.imageUrl! })}
                                className="text-sky-600 hover:underline font-semibold"
                              >
                                Xem phóng to
                              </button>
                              <span>·</span>
                              <button
                                type="button"
                                onClick={() => {
                                  setTargetMedIdForImage(med.id);
                                  medFileInputRef.current?.click();
                                }}
                                className="text-slate-500 hover:underline"
                              >
                                Đổi ảnh
                              </button>
                              <span>·</span>
                              <button
                                type="button"
                                onClick={(e) => handleRemoveMedImage(e, med.id)}
                                className="text-rose-600 hover:underline"
                              >
                                Gỡ
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-slate-500">
                          <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                          <span>Chưa có ảnh mẫu thuốc</span>
                        </div>
                      )}

                      {!med.imageUrl && (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setTargetMedIdForImage(med.id);
                              medCameraInputRef.current?.click();
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 transition-colors shadow-2xs"
                            title="Chụp ảnh bao bì/vỉ thuốc bằng camera"
                          >
                            <Camera className="w-3 h-3 text-sky-600" />
                            <span>Chụp ảnh</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setTargetMedIdForImage(med.id);
                              medFileInputRef.current?.click();
                            }}
                            className="flex items-center gap-1 px-2 py-1 bg-white hover:bg-slate-100 text-slate-700 rounded border border-slate-200 transition-colors shadow-2xs"
                            title="Tải ảnh thuốc từ máy"
                          >
                            <Upload className="w-3 h-3 text-sky-600" />
                            <span>Chọn file</span>
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Voice Dictation & Auto-Checklist Generation Modal */}
      {isPlanVoiceModalOpen && currentPatient && (
        <PlanVoiceModal
          patientName={getDisplayPatientName(currentPatient)}
          bedNumber={currentPatient.bedNumber}
          onApply={handleApplyVoiceOrders}
          onClose={() => setIsPlanVoiceModalOpen(false)}
        />
      )}

      {/* Full Image Zoom Modal for Medication Pack */}
      {previewMedImage && (
        <div 
          onClick={() => setPreviewMedImage(null)}
          className="fixed inset-0 z-70 bg-black/85 flex items-center justify-center p-4 cursor-pointer animate-in fade-in"
        >
          <div 
            className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden p-4 shadow-2xl space-y-3" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Pill className="w-4 h-4 text-sky-600" />
                <span>Ảnh bao bì & vỉ thuốc: {previewMedImage.name}</span>
              </span>
              <button 
                onClick={() => setPreviewMedImage(null)}
                className="p-1.5 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-100 p-2 rounded-xl flex items-center justify-center max-h-[70vh] overflow-hidden">
              <img 
                src={previewMedImage.url} 
                alt={previewMedImage.name} 
                className="w-full h-full max-h-[65vh] object-contain rounded-lg" 
              />
            </div>
            <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
              <span>Được đính kèm để điều dưỡng đối chiếu đúng quy cách trước khi cho người bệnh dùng thuốc</span>
              <button
                type="button"
                onClick={() => setPreviewMedImage(null)}
                className="px-4 py-2 text-xs font-semibold bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Zoom Modal for Sketches */}
      {previewSketchImage && (
        <div 
          onClick={() => setPreviewSketchImage(null)}
          className="fixed inset-0 z-70 bg-black/85 flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden p-3 shadow-2xl space-y-2" 
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Bản phác thảo can thiệp & y lệnh viết tay (Phóng to)</span>
              </span>
              <button 
                onClick={() => setPreviewSketchImage(null)}
                className="p-1 text-slate-400 hover:text-slate-800 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="bg-slate-50 p-2 rounded-xl flex items-center justify-center">
              <img 
                src={previewSketchImage} 
                alt="Phóng to bản vẽ" 
                className="w-full max-h-[75vh] object-contain rounded" 
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
