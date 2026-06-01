# LAIO - Luyện Từ All-In-One

Ứng dụng học và ôn tập từ vựng thông minh, kết hợp thuật toán Lặp lại ngắt quãng (Spaced Repetition) và các tính năng hỗ trợ bởi AI. Mục tiêu là giúp người dùng ghi nhớ từ vựng hiệu quả hơn thông qua lịch ôn tập được cá nhân hóa và các hình thức luyện tập đa dạng.

---

## Tính năng chính

- Quản lý từ vựng theo notebook cá nhân
- Lên lịch ôn tập tự động dựa trên thuật toán SuperMemo2
- Luyện tập qua các dạng trò chơi từ vựng
- Phát âm từ bằng Google Text-to-Speech
- Gợi ý và giải thích từ vựng bằng AI (Claude / Gemini)
- Xác thực người dùng và đồng bộ dữ liệu qua Supabase

---

## Công nghệ sử dụng

| Tầng | Công nghệ |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS, Zustand, shadcn/ui |
| Backend | Python FastAPI, Pydantic, Uvicorn |
| Database | Supabase (PostgreSQL + Auth) |
| AI / TTS | Claude API, Gemini API, Google Text-to-Speech |

---

## Cấu trúc dự án

```
luyentu-all-in-one/
├── frontend/                  # Giao diện người dùng (Next.js 14)
│   ├── src/app/               # Các trang chính: Dashboard, Notebook, Games
│   ├── src/components/        # Các component UI tái sử dụng
│   └── src/store/             # Quản lý trạng thái toàn cục (Zustand)
│
└── backend/                   # Xử lý logic và API (FastAPI)
    ├── app/api/               # Các endpoint: Auth, Vocab, Games, AI
    ├── app/core/              # Cấu hình hệ thống, bảo mật, kết nối DB
    ├── app/services/          # Tích hợp bên thứ ba: Google TTS, LLM
    └── app/srs/               # Thuật toán Spaced Repetition (SuperMemo2)
```

---

## Kiến trúc tổng quan

Frontend (Next.js) giao tiếp với Backend (FastAPI) qua REST API. Backend xử lý logic nghiệp vụ, tính toán lịch ôn tập theo SuperMemo2, và gọi các dịch vụ ngoài (Supabase, Google TTS, LLM). Dữ liệu người dùng và từ vựng được lưu trữ trên Supabase.

---

## Bắt đầu nhanh

**Yêu cầu:** Node.js 18+, Python 3.10+, tài khoản Supabase

```bash
# Clone dự án
git clone https://github.com/your-username/luyentu-all-in-one.git
cd luyentu-all-in-one

# Cài đặt frontend
cd frontend
npm install
cp .env.example .env.local   # Điền các biến môi trường
npm run dev

# Cài đặt backend (terminal mới)
cd backend
pip install -r requirements.txt
cp .env.example .env          # Điền các biến môi trường
uvicorn app.main:app --reload
```

Frontend chạy tại `http://localhost:3000`, Backend tại `http://localhost:8000`.

---

## Biến môi trường

Tạo file `.env` (backend) và `.env.local` (frontend) dựa trên file `.env.example` tương ứng. Các biến cần thiết bao gồm URL và key của Supabase, API key của Claude hoặc Gemini, và thông tin xác thực Google TTS.
