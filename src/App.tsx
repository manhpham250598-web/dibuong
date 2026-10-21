import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { Dashboard } from './components/Dashboard.tsx';
import { PatientList } from './components/PatientList.tsx';
import { WardRoundTab } from './components/WardRoundTab.tsx';
import { ReportsAndImport } from './components/ReportsAndImport.tsx';
import { PatientDetailModal } from './components/PatientDetailModal.tsx';
import { AddEditPatientModal } from './components/AddEditPatientModal.tsx';
import { DischargeModal } from './components/DischargeModal.tsx';
import { PrintReportView } from './components/PrintReportView.tsx';
import { LoginModal } from './components/LoginModal.tsx';
import { AdminManagement } from './components/AdminManagement.tsx';
import { Patient } from './types.ts';
import { CheckCircle2, AlertCircle, Info, HeartPulse } from 'lucide-react';

const AppContent: React.FC = () => {
  const { activeTab, setActiveTab, setSelectedPatientId, toast } = useApp();

  // Modals state
  const [detailPatientId, setDetailPatientId] = useState<string | null>(null);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);
  const [addPatientMode, setAddPatientMode] = useState<'manual' | 'scan'>('manual');
  const [patientToDischarge, setPatientToDischarge] = useState<Patient | null>(null);
  const [isPrintReportOpen, setIsPrintReportOpen] = useState(false);

  const handleOpenAddPatient = (mode: 'manual' | 'scan' = 'manual') => {
    setAddPatientMode(mode);
    setIsAddPatientOpen(true);
  };

  const handleGoToWardRoundFromDetail = (id: string) => {
    setSelectedPatientId(id);
    setActiveTab('ward_round');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      
      {/* Top Bar Navigation */}
      <Navbar />

      {/* Main Viewport Content with mobile safe bottom spacing */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 pb-24 md:pb-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            onOpenAddPatient={() => handleOpenAddPatient('manual')}
            onOpenPatientDetail={(id) => setDetailPatientId(id)}
          />
        )}

        {activeTab === 'patients' && (
          <PatientList
            onOpenAddPatient={handleOpenAddPatient}
            onOpenPatientDetail={(id) => setDetailPatientId(id)}
            onOpenDischargeModal={(patient) => setPatientToDischarge(patient)}
          />
        )}

        {activeTab === 'ward_round' && <WardRoundTab />}

        {activeTab === 'reports' && (
          <ReportsAndImport onOpenPrintReport={() => setIsPrintReportOpen(true)} />
        )}

        {activeTab === 'admin' && <AdminManagement />}
      </main>

      {/* Footer */}
      <footer className="no-print bg-white border-t border-slate-200 py-4 mt-auto hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-sky-600" />
            <span className="font-semibold text-slate-700">
              Khoa Rối Loạn Nhịp Tim · Bệnh Viện Đa Khoa Thành Phố Quảng Ninh
            </span>
          </div>
          <div>
            <span>Đường Tuệ Tĩnh, P. Bạch Đằng, TP. Hạ Long, Tỉnh Quảng Ninh · Hotline Cấp cứu: (0203) 3825 488</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      {detailPatientId && (
        <PatientDetailModal
          patientId={detailPatientId}
          onClose={() => setDetailPatientId(null)}
          onGoToWardRound={handleGoToWardRoundFromDetail}
        />
      )}

      {isAddPatientOpen && (
        <AddEditPatientModal
          initialMode={addPatientMode}
          onClose={() => setIsAddPatientOpen(false)}
        />
      )}

      {patientToDischarge && (
        <DischargeModal
          patient={patientToDischarge}
          onClose={() => setPatientToDischarge(null)}
        />
      )}

      {isPrintReportOpen && (
        <PrintReportView onClose={() => setIsPrintReportOpen(false)} />
      )}

      <LoginModal />

      {/* Toast Notification Container */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-60 animate-bounce duration-300">
          <div className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-2.5 text-xs font-semibold ${
            toast.type === 'error'
              ? 'bg-rose-50 text-rose-800 border-rose-200'
              : toast.type === 'info'
              ? 'bg-sky-50 text-sky-800 border-sky-200'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200'
          }`}>
            {toast.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : toast.type === 'info' ? (
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
