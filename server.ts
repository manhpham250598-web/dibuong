import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  // Body parser for base64 images (supports up to 35MB)
  app.use(express.json({ limit: '35mb' }));
  app.use(express.urlencoded({ extended: true, limit: '35mb' }));

  // Initialize GoogleGenAI SDK with user-agent
  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', hasGeminiKey: Boolean(apiKey) });
  });

  // Multimodal OCR / Extraction Endpoint: /api/extract-patient
  app.post('/api/extract-patient', async (req, res) => {
    try {
      const { imageBase64, mimeType = 'image/jpeg' } = req.body;

      if (!imageBase64) {
        return res.status(400).json({ 
          success: false, 
          error: 'Thiếu dữ liệu hình ảnh (imageBase64).' 
        });
      }

      if (!apiKey) {
        return res.status(500).json({ 
          success: false, 
          error: 'Chưa cấu hình GEMINI_API_KEY trong hệ thống.' 
        });
      }

      // Strip data URL scheme prefix if present
      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');

      const prompt = `Bạn là trợ lý AI số hóa tài liệu y tế chuyên khoa Rối loạn nhịp tim tại Bệnh viện Đa khoa Thành phố Quảng Ninh.
Nhiệm vụ của bạn là đọc và phân tích kỹ lưỡng hình ảnh phiếu điều trị / phiếu theo dõi điều trị / bệnh án / đơn thuốc được cung cấp, sau đó trích xuất thông tin bệnh nhân chính xác theo các quy chuẩn lâm sàng sau:

QUY CHUẨN TRÍCH XUẤT:
1. "fullName": Họ và tên bệnh nhân, viết HOA ĐẦY ĐỦ (ví dụ: "TRẦN VĂN HÀO", "NGUYỄN THỊ MAI").
2. "age": Tuổi của bệnh nhân (dạng số nguyên, ví dụ: 80). Nếu trên phiếu chỉ ghi năm sinh (ví dụ: 1946), hãy tính tuổi bằng 2026 - năm sinh (ví dụ 80).
3. "gender": Giới tính chính xác: "Nam" hoặc "Nữ".
4. "roomNumber": Buồng bệnh theo quy chuẩn rút gọn: Ví dụ "Buồng RLN27" hoặc "RLN27", "Buồng Cấp cứu Tim mạch", "Phòng 102", v.v.
5. "bedNumber": Số giường rút gọn theo quy chuẩn: Ví dụ "G104" (nếu ghi Giường 104 hoặc G.104), "G-CC03" (nếu ghi Giường cấp cứu 3), "G02", v.v.
6. "department": Tên khoa điều trị (ví dụ: "Khoa Nội Tim Mạch", "Khoa Rối loạn nhịp tim", v.v.).
7. "medicalRecordCode": Mã số bệnh án / Số lưu trữ nếu có (ví dụ: "26.052370").
8. "hospitalId": Mã người bệnh / Mã viện phí / Mã y tế nếu có (ví dụ: "18061239").
9. "admissionDiagnosis": Điền NGUYÊN VĂN toàn bộ chẩn đoán bệnh chính và các bệnh lý kèm theo được ghi trên phiếu (ví dụ: "Suy tim EF 43% - Rung nhĩ - BTTMCB - tăng huyết áp - COPD - Rối loạn chuyển hóa lipid - Suy thận mạn MLCT 19 ml/ph - Đái tháo đường type II").
10. "arrhythmiaType": Phân loại rối loạn nhịp tim chính dựa vào chẩn đoán. BẮT BUỘC chọn đúng 1 trong các mục sau:
   - "Rung nhĩ (AFib)" (Chọn mục này nếu chẩn đoán có Rung nhĩ, AF, AFib)
   - "Cuồng nhĩ (AFlut)"
   - "Cơn nhịp nhanh kịch phát trên thất (SVT)"
   - "Ngoại tâm thu thất (PVC/Lown IV)"
   - "Nhịp nhanh thất (VT)"
   - "Block nhĩ thất độ III (Complete AV Block)"
   - "Hội chứng Brugada"
   - "Hội chứng suy nút xoang (SSS)"
   - "Hội chứng QT dài (LQTS)"
   - "Sau cấy Máy tạo nhịp / ICD"
   - "Khác"
11. "triageLevel": Phân tầng nguy cơ: "warning" (vàng), "emergency" (đỏ/nguy kịch) hoặc "stable" (xanh/ổn định).
12. "hr": Tần số tim / mạch (số nguyên bpm) nếu ghi nhận trên phiếu, hoặc null.
13. "bp": Huyết áp dạng chuỗi (ví dụ: "135/80" hoặc "120/70") nếu có trên phiếu, hoặc null.
14. "spo2": Nồng độ oxy SpO2 (%) nếu có trên phiếu (số nguyên), hoặc null.
15. "allergies": Tiền sử dị ứng nếu có ghi nhận trên phiếu (ví dụ: "Dị ứng Penicillin", hoặc "Không" nếu ghi không dị ứng).
16. "pacemakerStatus": Tình trạng máy tạo nhịp nếu có (ví dụ: "Máy tạo nhịp 2 buồng DDDR" hoặc "Chưa có").

BẮT BUỘC: Trả về kết quả dưới dạng chuỗi JSON hợp lệ thuần túy, không kèm giải thích ngoài JSON.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                inlineData: {
                  mimeType: mimeType || 'image/jpeg',
                  data: cleanBase64,
                },
              },
              {
                text: prompt,
              },
            ],
          },
        ],
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text?.trim() || '{}';
      let parsedData: any = {};
      try {
        parsedData = JSON.parse(responseText);
      } catch (parseErr) {
        const cleaned = responseText
          .replace(/^```json\s*/, '')
          .replace(/```\s*$/, '')
          .trim();
        parsedData = JSON.parse(cleaned);
      }

      // Enforce clinical validation & default formatting
      if (parsedData.bedNumber) {
        // Normalize bed format: e.g. "Giường 104" -> "G104"
        parsedData.bedNumber = String(parsedData.bedNumber)
          .replace(/^(Giường|G\.?)\s*/i, 'G')
          .trim();
      }

      if (parsedData.roomNumber) {
        // Normalize room format
        const rStr = String(parsedData.roomNumber).trim();
        if (/^\d+$/.test(rStr)) {
          parsedData.roomNumber = `Buồng ${rStr}`;
        }
      }

      // Ensure age is a number
      if (parsedData.age) {
        parsedData.age = Number(parsedData.age) || 60;
      }

      // Ensure gender is valid
      if (parsedData.gender !== 'Nam' && parsedData.gender !== 'Nữ') {
        parsedData.gender = 'Nam';
      }

      // If diagnosis mentions "Rung nhĩ" or "AFib", auto-assign "Rung nhĩ (AFib)"
      if (
        parsedData.admissionDiagnosis &&
        /rung\s*nhĩ|afib|atrial\s*fibrillation/i.test(parsedData.admissionDiagnosis)
      ) {
        parsedData.arrhythmiaType = 'Rung nhĩ (AFib)';
      }

      return res.json({
        success: true,
        data: parsedData,
      });
    } catch (err: any) {
      console.error('Lỗi khi gọi Gemini API trích xuất ảnh:', err);
      return res.status(500).json({
        success: false,
        error: err.message || 'Không thể trích xuất dữ liệu từ hình ảnh bằng AI.',
      });
    }
  });

  // Mount Vite middleware in development mode, or serve static dist in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Khoa Rối Loạn Nhịp Tim] Server listening on port ${PORT}`);
  });
}

startServer();
