# Kế Hoạch Triển Khai: Đồng Bộ Dữ Liệu Thời Gian Thực Đa Thiết Bị (Cloud Database)

## 1. Tổng quan & Mục tiêu
Hiện tại hệ thống lưu trữ dữ liệu bệnh nhân cục bộ trên từng trình duyệt/máy tính (qua LocalStorage & bộ nhớ máy chủ cục bộ). Để các bác sĩ, điều dưỡng có thể cùng truy cập, xem hồ sơ, ra y lệnh và nhập thông tin bệnh nhân từ nhiều máy tính, máy tính bảng hoặc điện thoại khác nhau trong khoa, hệ thống cần được tích hợp cơ chế **Đồng bộ dữ liệu thời gian thực trên Cloud Database (Firebase Firestore)**.

Hệ thống sẽ giữ nguyên mô hình tài khoản và phân quyền theo chức danh y tế (Bác sĩ trưởng khoa, Bác sĩ điều trị, Cử nhân điều dưỡng, Quản trị viên) và hỗ trợ tự động đồng bộ 2 chiều (real-time sync).

---

## 2. Kiến trúc & Thiết kế kỹ thuật

### 2.1. Nền tảng cơ sở dữ liệu đám mây
- **Firebase Firestore**: Cơ sở dữ liệu NoSQL đám mây hỗ trợ lắng nghe thay đổi thời gian thực (`onSnapshot`).
- **Collections chính**:
  1. `patients`: Danh sách bệnh nhân nội trú (thông tin hành chính, buồng/giường, chẩn đoán, sinh tồn, phân tầng nguy cơ, trạng thái đang điều trị / xuất viện / lưu trữ).
  2. `ward_tasks`: Danh sách y lệnh, công việc điều dưỡng theo từng bệnh nhân.
  3. `ward_notes`: Lịch sử khám đi buồng (SOAPE, giọng nói, bản vẽ phác thảo).
  4. `app_audit_logs`: Nhật ký tiếp nhận, chuyển viện, xóa ca bệnh đã ra viện.

### 2.2. Trạng thái kết nối & Chỉ báo trên giao diện (UI Indicators)
- Thêm thanh trạng thái đám mây tinh tế trên Header / Navbar:
  - 🟢 **Đã kết nối đám mây (Online)**: Dữ liệu đang được đồng bộ trực tiếp với máy chủ trung tâm.
  - 🟡 **Đang đồng bộ (Syncing...)**: Đang gửi thay đổi lên đám mây khi vừa nhập ca mới hoặc cập nhật y lệnh.
  - ⚪ **Chế độ ngoại tuyến (Offline cache)**: Tự động lưu tạm trên máy và đẩy lên đám mây ngay khi có kết nối trở lại.
- Nút kích hoạt **"Đồng bộ ngay"** và kiểm tra trạng thái máy chủ.

### 2.3. Quy tắc bảo mật & Phân quyền (Security & Access Control)
- Dữ liệu được bảo vệ qua Firestore Rules, phân tách quyền:
  - Chỉ nhân viên y tế (Bác sĩ, Điều dưỡng đã đăng nhập) mới được ghi y lệnh, tiếp nhận ca bệnh.
  - Bác sĩ có quyền phê duyệt xuất viện và tiếp nhận ca mới.
  - Quản trị viên và Trưởng khoa có quyền dọn dẹp hàng loạt ca bệnh đã xuất viện để tiết kiệm dung lượng.

---

## 3. Các bước triển khai chi tiết

### Giai đoạn 1: Khởi tạo và cấp phát Firebase Cloud Database
- Kích hoạt tiến trình thiết lập Firebase qua `show_aistudio_ui` / `set_up_firebase` với cấu hình Firestore Web.
- Tạo tệp `firestore.rules` đảm bảo tính toàn vẹn dữ liệu lâm sàng.

### Giai đoạn 2: Cấu hình kết nối & Dịch vụ đồng bộ (Sync Service)
- Cài đặt cấu hình Firebase SDK (`src/firebase/config.ts`).
- Xây dựng lớp dịch vụ `src/services/cloudSyncService.ts`:
  - `subscribeToPatients(callback)`: Lắng nghe danh sách bệnh nhân thời gian thực.
  - `syncPatientToCloud(patient)`: Đẩy dữ liệu bệnh nhân mới hoặc chỉnh sửa lên Firestore.
  - `deletePatientFromCloud(id)` & `bulkDeleteDischargedFromCloud()`: Đồng bộ thao tác xóa dọn dẹp ca bệnh ra viện trên tất cả các máy.
  - `syncWardTask(patientId, task)`: Đồng bộ trạng thái hoàn thành checklist y lệnh tức thì giữa điều dưỡng và bác sĩ.

### Giai đoạn 3: Tích hợp vào AppContext & Trạng thái ứng dụng
- Nâng cấp `AppContext.tsx`:
  - Tự động nạp dữ liệu từ Cloud Firestore khi mở trang web trên bất kỳ máy tính nào.
  - Khi một máy thêm bệnh nhân mới hoặc tick hoàn thành y lệnh, các máy tính khác trong khoa tự động cập nhật ngay lập tức mà không cần tải lại trang.
  - Lưu bản sao đệm (Local Cache) để vẫn có thể tra cứu khi mất mạng cục bộ tạm thời.

### Giai đoạn 4: Cập nhật giao diện & Kiểm thử đa thiết bị
- Bổ sung chỉ báo kết nối đám mây trực quan trên Navbar.
- Kiểm thử luồng tiếp nhận bệnh nhân từ ảnh chụp phiếu điều trị trên máy A -> kiểm tra hiển thị tức thì trên máy B.
- Kiểm định biên dịch (`compile_applet`) và tối ưu hóa hiệu năng.
