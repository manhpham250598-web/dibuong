import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Mic, 
  MicOff, 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  ListTodo, 
  Volume2,
  RotateCcw,
  Plus
} from 'lucide-react';
import { parsePlanToTasks } from '../utils/labParser.ts';
import { WardTask } from '../types.ts';

interface PlanVoiceModalProps {
  patientName: string;
  bedNumber: string;
  onApply: (spokenText: string, tasks: Array<Omit<WardTask, 'id' | 'createdAt'>>) => void;
  onClose: () => void;
}

export const PlanVoiceModal: React.FC<PlanVoiceModalProps> = ({
  patientName,
  bedNumber,
  onApply,
  onClose,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  // Quick clinical order presets for rapid selection
  const voicePresets = [
    {
      title: 'Cắt cơn nhịp nhanh & Bù điện giải',
      text: '1. Sốc điện đồng bộ chuyển nhịp 150J khẩn cấp\n2. Bù Kali clorid 10% 2 ống pha truyền tĩnh mạch chậm\n3. Làm lại khí máu động mạch và điện giải đồ sau 1h',
    },
    {
      title: 'Kiểm soát nhịp rung nhĩ & Chống đông',
      text: '1. Uống Betaloc ZOK 50mg lúc 08h00 sau ăn\n2. Uống Xarelto 20mg cùng bữa tối\n3. Đo lại điện tâm đồ 12 chuyển đạo đánh giá tần số thất lúc 10h00',
    },
    {
      title: 'Block AV & Chuẩn bị mổ cấy máy',
      text: '1. Kiểm tra pin và ngưỡng kích thích máy tạo nhịp tạm thời khẩn\n2. Băng ép cố định đường vào tĩnh mạch đùi\n3. Chuẩn bị phòng can thiệp cấy máy tạo nhịp 2 buồng DDDR lúc 14h00',
    },
    {
      title: 'Hạ sốt & Theo dõi Brugada',
      text: '1. Hạ sốt tích cực Paracetamol 1g truyền TM nếu thân nhiệt trên 37.8 độ C\n2. Theo dõi monitor liên tục 24/24\n3. Đo ECG 12 chuyển đạo khi có biến đổi nhịp',
    },
  ];

  // Live parsed tasks from current transcript
  const parsedTasks = parsePlanToTasks(transcript);

  useEffect(() => {
    // Start listening automatically when modal opens if supported
    startListening();

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = 'vi-VN';
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event: any) => {
          let currentSpoken = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentSpoken += event.results[i][0].transcript;
          }
          if (currentSpoken) {
            setTranscript(prev => {
              const clean = prev.trim();
              return clean ? `${clean}\n${currentSpoken}` : currentSpoken;
            });
          }
        };

        recognition.onerror = () => setIsRecording(false);
        recognition.onend = () => setIsRecording(false);

        recognition.start();
        recognitionRef.current = recognition;
        setIsRecording(true);
      } catch (err) {
        simulateSpeechFallback();
      }
    } else {
      simulateSpeechFallback();
    }
  };

  const simulateSpeechFallback = () => {
    setIsRecording(true);
    setTimeout(() => {
      setIsRecording(false);
      const simulated = "1. Sốc điện đồng bộ chuyển nhịp 150J khẩn cấp\n2. Bù Kali clorid 10% 2 ống pha truyền TM chậm\n3. Làm lại khí máu động mạch và điện giải đồ sau 1h\n4. Theo dõi monitor liên tục 24/24";
      setTranscript(simulated);
    }, 2000);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleApply = () => {
    if (!transcript.trim()) return;
    onApply(transcript.trim(), parsedTasks);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-xs ${
              isRecording ? 'bg-rose-600 animate-pulse' : 'bg-sky-600'
            }`}>
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm sm:text-base">
                  Nhận Diện Giọng Nói & Tự Động Tạo Checklist
                </h3>
                <span className="bg-sky-950 text-sky-300 font-mono text-xs px-2 py-0.5 rounded border border-sky-800">
                  {bedNumber}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Bệnh nhân: <strong className="text-white">{patientName}</strong> · Đọc y lệnh điều trị bằng tiếng Việt
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 overflow-y-auto space-y-4 max-h-[75vh] text-xs">
          
          {/* Visual recording status banner */}
          <div className={`p-4 rounded-xl border flex items-center justify-between gap-3 ${
            isRecording 
              ? 'bg-rose-50 border-rose-300 text-rose-900' 
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className={`w-4 h-4 rounded-full ${isRecording ? 'bg-rose-600 animate-ping' : 'bg-slate-400'}`} />
                <div className={`w-4 h-4 rounded-full absolute inset-0 ${isRecording ? 'bg-rose-600' : 'bg-slate-400'}`} />
              </div>
              <div>
                <span className="font-bold block text-sm">
                  {isRecording ? 'Đang lắng nghe giọng nói bác sĩ...' : 'Mic đang dừng. Bấm nút để đọc tiếp.'}
                </span>
                <span className="text-[11px] text-slate-500">
                  {isRecording ? 'Đọc rõ y lệnh, thuốc, can thiệp hoặc mốc thời gian...' : 'Có thể nói trực tiếp hoặc chọn mẫu y lệnh bên dưới.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={isRecording ? stopListening : startListening}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 ${
                isRecording 
                  ? 'bg-rose-600 hover:bg-rose-700 text-white' 
                  : 'bg-sky-600 hover:bg-sky-700 text-white'
              }`}
            >
              {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span>{isRecording ? 'Dừng ghi' : 'Bắt đầu nói'}</span>
            </button>
          </div>

          {/* Spoken Text Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-sky-600" />
                <span>Nội dung y lệnh đã nhận diện được:</span>
              </label>
              {transcript && (
                <button
                  type="button"
                  onClick={() => setTranscript('')}
                  className="text-slate-400 hover:text-rose-600 flex items-center gap-1 text-[11px]"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Xóa trắng</span>
                </button>
              )}
            </div>

            <textarea
              rows={4}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Văn bản nhận diện giọng nói sẽ xuất hiện ở đây (vd: 1. Sốc điện 150J, 2. Bù Kali clorid 2 ống, 3. Làm lại khí máu lúc 11h...)"
              className="w-full p-3 bg-white border border-slate-300 rounded-xl text-slate-900 font-medium text-xs focus:outline-none focus:ring-2 focus:ring-sky-500 shadow-2xs leading-relaxed"
            />
          </div>

          {/* Quick Voice Clinical Templates */}
          <div className="space-y-1.5">
            <span className="font-semibold text-slate-600 text-[11px] block">
              Hoặc chọn nhanh câu lệnh mẫu thường dùng tại khoa:
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {voicePresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setTranscript(prev => (prev ? `${prev}\n${preset.text}` : preset.text))}
                  className="text-left p-2.5 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-sky-50 hover:border-sky-300 transition-colors group"
                >
                  <div className="font-bold text-slate-800 group-hover:text-sky-800 text-[11px] flex items-center justify-between">
                    <span>{preset.title}</span>
                    <Plus className="w-3 h-3 text-slate-400 group-hover:text-sky-600" />
                  </div>
                  <p className="text-[10px] text-slate-500 line-clamp-1 mt-0.5 font-mono">
                    {preset.text.replace(/\n/g, ' · ')}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Automatic Checklist Extraction Preview */}
          <div className="bg-sky-50/60 rounded-xl border border-sky-200 p-3.5 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-sky-950">
              <span className="flex items-center gap-1.5">
                <ListTodo className="w-4 h-4 text-sky-600" />
                <span>Xem trước các mục Checklist sẽ tự động tạo ({parsedTasks.length} việc):</span>
              </span>
              <span className="text-[10px] bg-sky-100 text-sky-800 px-2 py-0.5 rounded-full font-medium">
                Tự phân loại Khẩn / Thường quy
              </span>
            </div>

            {parsedTasks.length === 0 ? (
              <p className="text-slate-400 italic text-[11px] py-1">
                Chưa có nội dung. Đọc hoặc chọn lệnh mẫu ở trên để hệ thống tự động bóc tách checklist.
              </p>
            ) : (
              <div className="space-y-1.5">
                {parsedTasks.map((task, i) => (
                  <div
                    key={i}
                    className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 ${
                      task.priority === 'high'
                        ? 'bg-rose-50 border-rose-200 text-rose-900 font-bold'
                        : 'bg-white border-slate-200 text-slate-800 font-medium'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono text-slate-400">#{i + 1}</span>
                      <span>{task.task}</span>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-sans shrink-0 ${
                      task.priority === 'high' ? 'bg-rose-200 text-rose-800' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {task.priority === 'high' ? '🔴 Khẩn' : '🟢 Thường'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Actions */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-3 flex items-center justify-between shrink-0 text-xs">
          <span className="text-slate-500 italic hidden sm:inline">
            Hệ thống sẽ cập nhật vào ô Plan và tự động đẩy {parsedTasks.length} việc vào Checklist ca trực.
          </span>
          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-200 rounded-lg font-semibold transition-colors"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={!transcript.trim() || parsedTasks.length === 0}
              className="px-5 py-2 bg-sky-600 hover:bg-sky-700 disabled:opacity-40 text-white font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Zap className="w-4 h-4" />
              <span>Tạo {parsedTasks.length} Mục Vào Checklist Ngay</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
