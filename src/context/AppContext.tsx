import React, { createContext, useContext, useState, useEffect } from 'react';
import { Patient, User, LabEntry, WardRoundNote, WardTask, MedicalFile } from '../types.ts';
import { INITIAL_PATIENTS, INITIAL_USERS } from '../mockData.ts';
import { 
  subscribePatientsFromCloud, 
  savePatientToCloud, 
  deletePatientFromCloud, 
  bulkDeleteDischargedFromCloud, 
  syncAllPatientsToCloud, 
  isCloudDatabaseEmpty, 
  SyncStatus 
} from '../services/cloudSyncService.ts';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (u: User) => void;
  users: User[];
  isLoggedIn: boolean;
  loginModalOpen: boolean;
  setLoginModalOpen: (open: boolean) => void;
  login: (username: string, password?: string) => boolean;
  logout: () => void;
  addUser: (userData: Omit<User, 'id'>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  deleteUser: (id: string) => void;
  resetUserPassword: (id: string, newPassword: string) => void;
  patients: Patient[];
  privacyMask: boolean;
  setPrivacyMask: (val: boolean | ((prev: boolean) => boolean)) => void;
  activeTab: 'dashboard' | 'patients' | 'ward_round' | 'reports' | 'admin';
  setActiveTab: (tab: 'dashboard' | 'patients' | 'ward_round' | 'reports' | 'admin') => void;
  selectedPatientId: string | null;
  setSelectedPatientId: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filterTriage: string;
  setFilterTriage: (t: string) => void;
  filterArrhythmia: string;
  setFilterArrhythmia: (a: string) => void;
  addPatient: (p: Omit<Patient, 'id'>) => void;
  updatePatient: (id: string, updates: Partial<Patient>) => void;
  dischargePatient: (id: string, summary: string) => void;
  archiveOrDeletePatient: (id: string, permanentDelete: boolean) => void;
  bulkDeleteDischargedPatients: () => void;
  addLabResult: (patientId: string, lab: LabEntry) => void;
  addWardRoundNote: (patientId: string, note: WardRoundNote) => void;
  toggleTaskDone: (patientId: string, taskId: string) => void;
  addWardTask: (patientId: string, task: Omit<WardTask, 'id' | 'createdAt'>) => void;
  addWardTasksBatch: (patientId: string, tasks: Array<Omit<WardTask, 'id' | 'createdAt'>>) => void;
  addMedicalFile: (patientId: string, file: MedicalFile) => void;
  resetToMockData: () => void;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  getDisplayPatientName: (patient: Patient) => string;
  cloudSyncStatus: SyncStatus;
  lastSyncedAt: string | null;
  syncNow: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const PATIENTS_STORAGE_KEY = 'bvqn_arrhythmia_patients_v1';
const USER_STORAGE_KEY = 'bvqn_arrhythmia_user_v1';
const USERS_LIST_STORAGE_KEY = 'bvqn_arrhythmia_users_list_v1';
const PRIVACY_STORAGE_KEY = 'bvqn_privacy_mask_v1';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Staff users state
  const [users, setUsers] = useState<User[]>(() => {
    try {
      const saved = localStorage.getItem(USERS_LIST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      // fallback
    }
    return INITIAL_USERS;
  });

  // Current user initialization
  const [currentUser, setCurrentUser] = useState<User>(() => {
    try {
      const saved = localStorage.getItem(USER_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // fallback
    }
    return INITIAL_USERS[0]; // Default to BS. CKII Phạm Minh Tuấn
  });

  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(true);
  const [loginModalOpen, setLoginModalOpen] = useState<boolean>(false);

  // Helper to ensure all tasks have strictly unique IDs
  const sanitizePatients = (patientList: Patient[]): Patient[] => {
    return patientList.map(p => {
      const seen = new Set<string>();
      const sanitizedTasks = (p.wardTasks || []).map((t, idx) => {
        if (!t.id || seen.has(t.id)) {
          const uniqueId = `task-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;
          seen.add(uniqueId);
          return { ...t, id: uniqueId };
        }
        seen.add(t.id);
        return t;
      });
      return { ...p, wardTasks: sanitizedTasks };
    });
  };

  // Patients state
  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const saved = localStorage.getItem(PATIENTS_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return sanitizePatients(parsed);
      }
    } catch (e) {
      // fallback
    }
    return sanitizePatients(INITIAL_PATIENTS);
  });

  // Privacy mask toggle (hides full patient name and ID during rounds or public presentation)
  const [privacyMask, setPrivacyMask] = useState<boolean>(() => {
    try {
      return localStorage.getItem(PRIVACY_STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'patients' | 'ward_round' | 'reports' | 'admin'>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(INITIAL_PATIENTS[0]?.id || null);

  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTriage, setFilterTriage] = useState('all');
  const [filterArrhythmia, setFilterArrhythmia] = useState('all');

  // Cloud Sync state
  const [cloudSyncStatus, setCloudSyncStatus] = useState<SyncStatus>('syncing');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);

  // Toast notification
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // Real-time Cloud Synchronization (Multi-device support via Firebase Firestore)
  useEffect(() => {
    let isSubscribed = true;

    const setupCloud = async () => {
      try {
        const isEmpty = await isCloudDatabaseEmpty();
        if (isEmpty && isSubscribed) {
          // Seed cloud database with initial data so other devices see data immediately
          await syncAllPatientsToCloud(patients);
        }
      } catch (err) {
        console.warn('Lỗi kiểm tra cơ sở dữ liệu đám mây:', err);
      }
    };

    setupCloud();

    // Subscribe to real-time changes across all clinic machines
    const unsubscribe = subscribePatientsFromCloud(
      (cloudPatients) => {
        if (!isSubscribed) return;
        if (cloudPatients && cloudPatients.length > 0) {
          setPatients(sanitizePatients(cloudPatients));
          setLastSyncedAt(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        }
      },
      (status) => {
        if (isSubscribed) setCloudSyncStatus(status);
      }
    );

    return () => {
      isSubscribed = false;
      unsubscribe();
    };
  }, []);

  // Sync users to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(USERS_LIST_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users list', e);
    }
  }, [users]);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(PATIENTS_STORAGE_KEY, JSON.stringify(patients));
    } catch (e) {
      console.error('Failed to save patients to localStorage', e);
    }
  }, [patients]);

  useEffect(() => {
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(currentUser));
    } catch (e) {
      console.error('Failed to save user to localStorage', e);
    }
  }, [currentUser]);

  useEffect(() => {
    try {
      localStorage.setItem(PRIVACY_STORAGE_KEY, String(privacyMask));
    } catch (e) {
      console.error('Failed to save privacy mask to localStorage', e);
    }
  }, [privacyMask]);

  const login = (username: string, password?: string): boolean => {
    const cleanUsername = username.toLowerCase().trim();
    const user = users.find(u => u.username.toLowerCase() === cleanUsername);
    if (!user) {
      showToast('Tài khoản không tồn tại trong hệ thống.', 'error');
      return false;
    }

    if (user.status === 'locked') {
      showToast('Tài khoản này hiện đang bị tạm khóa. Vui lòng liên hệ Admin.', 'error');
      return false;
    }

    // Check password if provided
    if (password && user.password && user.password !== password) {
      showToast('Mật khẩu không chính xác. Vui lòng kiểm tra lại.', 'error');
      return false;
    }

    setCurrentUser(user);
    setIsLoggedIn(true);
    setLoginModalOpen(false);
    const roleLabel = user.role === 'admin' ? 'Quản trị viên' : user.role === 'nurse' ? 'Điều dưỡng' : 'Bác sĩ';
    showToast(`Đăng nhập thành công: ${user.title} ${user.name} (${roleLabel})`, 'success');
    return true;
  };

  const logout = () => {
    setIsLoggedIn(false);
    setLoginModalOpen(true);
    showToast('Đã đăng xuất phiên làm việc.', 'info');
  };

  // Admin User CRUD Methods
  const addUser = (userData: Omit<User, 'id'>) => {
    const exists = users.some(u => u.username.toLowerCase() === userData.username.toLowerCase().trim());
    if (exists) {
      showToast(`Tên đăng nhập "${userData.username}" đã được sử dụng.`, 'error');
      return;
    }

    const newUser: User = {
      ...userData,
      id: `u-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString().slice(0, 10),
      status: userData.status || 'active',
      password: userData.password || '123456',
    };

    setUsers(prev => [newUser, ...prev]);
    showToast(`Đã tạo tài khoản mới thành công cho ${newUser.title} ${newUser.name}.`, 'success');
  };

  const updateUser = (id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updates } : u)));
    if (currentUser.id === id) {
      setCurrentUser(prev => ({ ...prev, ...updates }));
    }
    showToast('Đã cập nhật thông tin tài khoản thành công.', 'success');
  };

  const deleteUser = (id: string) => {
    if (id === currentUser.id) {
      showToast('Không thể xóa tài khoản của chính bạn đang đăng nhập.', 'error');
      return;
    }
    setUsers(prev => prev.filter(u => u.id !== id));
    showToast('Đã xóa tài khoản khỏi hệ thống.', 'info');
  };

  const resetUserPassword = (id: string, newPass: string) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, password: newPass } : u)));
    showToast('Đã đặt lại mật khẩu mới cho tài khoản thành công.', 'success');
  };

  const addPatient = (newPatientData: Omit<Patient, 'id'>) => {
    const newId = `p-${Date.now()}`;
    const newPatient: Patient = {
      ...newPatientData,
      id: newId,
    };
    setPatients(prev => [newPatient, ...prev]);
    savePatientToCloud(newPatient);
    showToast(`Đã tiếp nhận bệnh nhân mới: ${newPatient.fullName} vào ${newPatient.roomNumber}`, 'success');
  };

  const updatePatient = (id: string, updates: Partial<Patient>) => {
    setPatients(prev => {
      const updatedList = prev.map(p => {
        if (p.id === id) {
          const updated = { ...p, ...updates };
          savePatientToCloud(updated);
          return updated;
        }
        return p;
      });
      return updatedList;
    });
    showToast('Đã cập nhật hồ sơ bệnh nhân thành công.', 'success');
  };

  const dischargePatient = (id: string, summary: string) => {
    const now = new Date().toISOString().slice(0, 10);
    setPatients(prev => {
      const updatedList = prev.map(p => {
        if (p.id === id) {
          const discharged = {
            ...p,
            status: 'discharged' as const,
            dischargeDate: now,
            dischargeSummary: summary,
          };
          savePatientToCloud(discharged);
          return discharged;
        }
        return p;
      });
      return updatedList;
    });
    showToast('Đã hoàn tất thủ tục xuất viện cho bệnh nhân.', 'info');
  };

  const archiveOrDeletePatient = (id: string, permanentDelete: boolean) => {
    if (permanentDelete) {
      setPatients(prev => prev.filter(p => p.id !== id));
      deletePatientFromCloud(id);
      if (selectedPatientId === id) {
        setSelectedPatientId(patients.find(p => p.id !== id)?.id || null);
      }
      showToast('Đã xóa vĩnh viễn hồ sơ bệnh nhân để giải phóng dung lượng.', 'info');
    } else {
      setPatients(prev => {
        const updatedList = prev.map(p => {
          if (p.id === id) {
            const archived = { ...p, status: 'archived' as const };
            savePatientToCloud(archived);
            return archived;
          }
          return p;
        });
        return updatedList;
      });
      showToast('Đã chuyển bệnh án vào Kho lưu trữ an toàn.', 'success');
    }
  };

  const bulkDeleteDischargedPatients = () => {
    const discharged = patients.filter(p => p.status === 'discharged');
    if (discharged.length === 0) {
      showToast('Không có ca bệnh nhân đã xuất viện nào để xóa.', 'info');
      return;
    }
    const dischargedIds = discharged.map(p => p.id);
    setPatients(prev => prev.filter(p => p.status !== 'discharged'));
    bulkDeleteDischargedFromCloud(dischargedIds);
    if (selectedPatientId && patients.find(p => p.id === selectedPatientId && p.status === 'discharged')) {
      setSelectedPatientId(patients.find(p => p.status !== 'discharged')?.id || null);
    }
    showToast(`Đã xóa sạch toàn bộ ${discharged.length} ca bệnh đã xuất viện, giải phóng bộ nhớ hệ thống thành công.`, 'success');
  };

  const addLabResult = (patientId: string, lab: LabEntry) => {
    setPatients(prev =>
      prev.map(p => {
        if (p.id === patientId) {
          const updated = {
            ...p,
            labTimeline: [lab, ...p.labTimeline],
          };
          savePatientToCloud(updated);
          return updated;
        }
        return p;
      })
    );
    showToast('Đã bổ sung kết quả xét nghiệm mới vào dòng thời gian.', 'success');
  };

  const addWardRoundNote = (patientId: string, note: WardRoundNote) => {
    setPatients(prev =>
      prev.map(p => {
        if (p.id === patientId) {
          const updated = {
            ...p,
            wardRoundNotes: [note, ...p.wardRoundNotes],
          };
          savePatientToCloud(updated);
          return updated;
        }
        return p;
      })
    );
    showToast('Đã lưu ghi chú diễn biến Đi buồng (SOAPE).', 'success');
  };

  const toggleTaskDone = (patientId: string, taskId: string) => {
    setPatients(prev =>
      prev.map(p => {
        if (p.id === patientId) {
          const updated = {
            ...p,
            wardTasks: p.wardTasks.map(t => (t.id === taskId ? { ...t, done: !t.done } : t)),
          };
          savePatientToCloud(updated);
          return updated;
        }
        return p;
      })
    );
  };

  const addWardTask = (patientId: string, task: Omit<WardTask, 'id' | 'createdAt'>) => {
    const newTask: WardTask = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    setPatients(prev =>
      prev.map(p => {
        if (p.id === patientId) {
          const updated = {
            ...p,
            wardTasks: [newTask, ...p.wardTasks],
          };
          savePatientToCloud(updated);
          return updated;
        }
        return p;
      })
    );
    showToast('Đã thêm y lệnh / công việc mới vào checklist.', 'success');
  };

  const addWardTasksBatch = (patientId: string, tasksToAdd: Array<Omit<WardTask, 'id' | 'createdAt'>>) => {
    const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
    const newTasks: WardTask[] = tasksToAdd.map((t, idx) => ({
      ...t,
      id: `task-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 9)}`,
      createdAt: now,
    }));
    setPatients(prev =>
      prev.map(p => {
        if (p.id === patientId) {
          const updated = {
            ...p,
            wardTasks: [...newTasks, ...p.wardTasks],
          };
          savePatientToCloud(updated);
          return updated;
        }
        return p;
      })
    );
  };

  const addMedicalFile = (patientId: string, file: MedicalFile) => {
    setPatients(prev =>
      prev.map(p => {
        if (p.id === patientId) {
          const updated = {
            ...p,
            files: [file, ...p.files],
          };
          savePatientToCloud(updated);
          return updated;
        }
        return p;
      })
    );
    showToast(`Đã tải lên tài liệu y tế: ${file.name}`, 'success');
  };

  const resetToMockData = () => {
    const fresh = sanitizePatients(INITIAL_PATIENTS);
    setPatients(fresh);
    setSelectedPatientId(fresh[0]?.id || null);
    syncAllPatientsToCloud(fresh);
    showToast('Đã khôi phục dữ liệu mẫu chuẩn và đồng bộ lên đám mây.', 'info');
  };

  const syncNow = async () => {
    setCloudSyncStatus('syncing');
    const ok = await syncAllPatientsToCloud(patients);
    if (ok) {
      setCloudSyncStatus('connected');
      setLastSyncedAt(new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      showToast('Đã đồng bộ toàn bộ dữ liệu lên Cloud Database thành công!', 'success');
    } else {
      setCloudSyncStatus('error');
      showToast('Không thể đồng bộ lên đám mây. Vui lòng kiểm tra kết nối mạng.', 'error');
    }
  };

  // Helper to format patient name respecting privacy mode
  const getDisplayPatientName = (patient: Patient): string => {
    if (!privacyMask) return patient.fullName;
    // Mask name: e.g. "Trần Văn Mạnh" -> "T. V. M (G-CC01)"
    const words = patient.fullName.trim().split(/\s+/);
    if (words.length <= 1) return patient.fullName[0] + '***';
    const initials = words.map(w => w[0].toUpperCase() + '.').join(' ');
    return `${initials} [${patient.bedNumber}]`;
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        addUser,
        updateUser,
        deleteUser,
        resetUserPassword,
        isLoggedIn,
        loginModalOpen,
        setLoginModalOpen,
        login,
        logout,
        patients,
        privacyMask,
        setPrivacyMask,
        activeTab,
        setActiveTab,
        selectedPatientId,
        setSelectedPatientId,
        searchQuery,
        setSearchQuery,
        filterTriage,
        setFilterTriage,
        filterArrhythmia,
        setFilterArrhythmia,
        addPatient,
        updatePatient,
        dischargePatient,
        archiveOrDeletePatient,
        bulkDeleteDischargedPatients,
        addLabResult,
        addWardRoundNote,
        toggleTaskDone,
        addWardTask,
        addWardTasksBatch,
        addMedicalFile,
        resetToMockData,
        toast,
        showToast,
        getDisplayPatientName,
        cloudSyncStatus,
        lastSyncedAt,
        syncNow,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
