import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  writeBatch,
  getDocs,
  query,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config.ts';
import { Patient } from '../types.ts';

const PATIENTS_COLLECTION = 'patients';

export type SyncStatus = 'connected' | 'syncing' | 'offline' | 'error';

/**
 * Lắng nghe thay đổi danh sách bệnh nhân thời gian thực từ Cloud Firestore
 */
export const subscribePatientsFromCloud = (
  onUpdate: (patients: Patient[]) => void,
  onStatusChange: (status: SyncStatus) => void
) => {
  try {
    const colRef = collection(db, PATIENTS_COLLECTION);
    onStatusChange('syncing');

    const unsubscribe = onSnapshot(
      colRef,
      (snapshot) => {
        const cloudPatients: Patient[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data() as Patient;
          cloudPatients.push({
            ...data,
            id: docSnap.id,
          });
        });

        onUpdate(cloudPatients);
        onStatusChange('connected');
      },
      (error) => {
        console.error('Lỗi kết nối Firestore real-time:', error);
        onStatusChange('error');
      }
    );

    return unsubscribe;
  } catch (err) {
    console.error('Không thể khởi tạo lắng nghe Firestore:', err);
    onStatusChange('offline');
    return () => {};
  }
};

/**
 * Lưu hoặc cập nhật một bệnh nhân lên Cloud Firestore
 */
export const savePatientToCloud = async (patient: Patient): Promise<boolean> => {
  try {
    const patientRef = doc(db, PATIENTS_COLLECTION, patient.id);
    await setDoc(patientRef, {
      ...patient,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    return true;
  } catch (error) {
    console.error(`Lỗi khi lưu bệnh nhân ${patient.id} lên Firestore:`, error);
    return false;
  }
};

/**
 * Xóa một bệnh nhân khỏi Cloud Firestore
 */
export const deletePatientFromCloud = async (patientId: string): Promise<boolean> => {
  try {
    const patientRef = doc(db, PATIENTS_COLLECTION, patientId);
    await deleteDoc(patientRef);
    return true;
  } catch (error) {
    console.error(`Lỗi khi xóa bệnh nhân ${patientId} khỏi Firestore:`, error);
    return false;
  }
};

/**
 * Xóa hàng loạt bệnh nhân đã xuất viện khỏi Cloud Firestore
 */
export const bulkDeleteDischargedFromCloud = async (dischargedIds: string[]): Promise<boolean> => {
  try {
    if (dischargedIds.length === 0) return true;
    const batch = writeBatch(db);
    dischargedIds.forEach((id) => {
      const ref = doc(db, PATIENTS_COLLECTION, id);
      batch.delete(ref);
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Lỗi khi dọn dẹp hàng loạt bệnh nhân ra viện trên Firestore:', error);
    return false;
  }
};

/**
 * Đẩy toàn bộ danh sách bệnh nhân lên Firestore (đồng bộ khởi tạo hoặc khi khôi phục mẫu)
 */
export const syncAllPatientsToCloud = async (patients: Patient[]): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    patients.forEach((patient) => {
      const ref = doc(db, PATIENTS_COLLECTION, patient.id);
      batch.set(ref, {
        ...patient,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    });
    await batch.commit();
    return true;
  } catch (error) {
    console.error('Lỗi đồng bộ hàng loạt lên Firestore:', error);
    return false;
  }
};

/**
 * Kiểm tra xem Firestore đã có dữ liệu hay chưa
 */
export const isCloudDatabaseEmpty = async (): Promise<boolean> => {
  try {
    const q = query(collection(db, PATIENTS_COLLECTION), limit(1));
    const snapshot = await getDocs(q);
    return snapshot.empty;
  } catch {
    return false;
  }
};
