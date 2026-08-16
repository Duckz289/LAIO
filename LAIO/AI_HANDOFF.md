# LAIO — AI Handoff và Quy tắc Không Làm Vỡ Hệ Thống

Gửi file này cho bất kỳ AI/người nào sẽ sửa code LAIO. Mục tiêu là giữ một
nguồn sự thật duy nhất từ database đến backend, API và frontend.

## Những file phải gửi kèm

Gửi **toàn bộ** các file sau trước khi yêu cầu AI sửa tính năng:

1. File SQL Supabase gốc: **LAIO Schema v2 — vocabulary slice** (bắt buộc).
   File này là nguồn sự thật của database; không thay bằng ảnh chụp hoặc mô tả.
2. `AI_HANDOFF.md` — file này.
3. `CLAUDE.md` — quy ước làm việc hiện tại của repo.
4. `ARCHITECTURE.md` — ranh giới domain và transaction.
5. `API_CONTRACT.md` — public API contract.
6. `TECH_DEBT.md` — các rủi ro/việc chưa làm.

Khi AI cần sửa code cụ thể, gửi thêm đúng vùng mã liên quan:

| Việc | File/thư mục cần có |
|---|---|
| Model/database | `backend/app/core/models/`, `backend/alembic/versions/` |
| Business logic | `backend/app/services/` |
| HTTP API | `backend/app/api/deps.py`, `backend/app/api/v1/`, `backend/app/schemas/` |
| Frontend gọi API | `frontend/src/lib/api.ts`, `frontend/src/app/api/backend/[...path]/route.ts` |
| Notebook/vocabulary UI | `frontend/src/app/notebooks/`, `frontend/src/app/notebooks/[id]/` |
| Regression test | `backend/tests/` |

**Không gửi** `.env`, `.env.local`, Supabase service key, JWT secret, database
URL hoặc token đăng nhập cho AI/người khác.

## Thứ tự đọc bắt buộc

1. Schema SQL gốc.
2. File này và `CLAUDE.md`.
3. `ARCHITECTURE.md` và `API_CONTRACT.md`.
4. Model → schema Pydantic → service → route → frontend API client → page.
5. Test hiện có trước khi sửa bất kỳ file nào.

Nếu docs và code lệch nhau: dừng lại, báo rõ chỗ lệch; không tự đoán hoặc tự
tạo bảng/route/field mới.

## Kiến trúc hiện tại

LAIO là modular monolith:

```text
Supabase PostgreSQL
        ↑
SQLAlchemy models ← services (business rules) ← FastAPI routes ← frontend api.ts
```

- Route chỉ parse request, gọi một service và trả response.
- Business rule, ownership check và transaction logic đặt trong `services/`.
- Mọi query thuộc user phải lọc bằng `user_id` từ JWT đã verify.
- Một request dùng một SQLAlchemy session; service chỉ `flush`, dependency DB
  mới `commit` hoặc `rollback`.
- Frontend chỉ gọi backend qua `frontend/src/lib/api.ts`; không gọi database
  Supabase trực tiếp để đọc/ghi product data.

## Database v2: quy tắc không được phá

| Thành phần | Quy tắc bắt buộc |
|---|---|
| `notebooks` | Thuộc một `user_id`; xoá notebook cascade vocabulary. |
| `vocab_items` | Thuộc notebook; `is_mastered` chỉ là cờ UI, không phải trạng thái SRS. |
| `vocab_progress` | Một row duy nhất mỗi `(vocab_item_id, user_id)`; là lịch SRS hiện tại. |
| Trigger `trg_vocab_items_create_progress` | Database tự tạo `vocab_progress` sau khi thêm từ. Service **không được insert lần hai**. |
| `review_history` | Append-only audit trail; snapshot dùng đúng tên `ease_before`, `ease_after`, `interval_before`, `interval_after`, `next_review_date_after`. |
| `learning_sessions` | `status` là `VARCHAR(20)`: `active`, `completed`, `abandoned`; accuracy tính từ counters, không có cột accuracy trong schema v2. |
| `game_sessions` | `accuracy_percentage` là generated column; không insert/update trực tiếp; schema v2 không có `created_at`. |
| `review_type_enum` | Chỉ dùng: `multiple_choice`, `typing`, `matching`, `flashcard`, `listening`, `speaking`. |

Các cột schedule trả ra cho vocabulary API là:
`next_review_date`, `repetition_count`, `interval_days`, `ease_factor`.

## API hiện có — không tự đổi tên

Base URL: `/api/v1`. Tất cả product endpoint cần bearer token Supabase.

```text
GET/POST                 /notebooks/
GET/PUT/DELETE           /notebooks/{notebook_id}

GET                       /vocab-items/notebook/{notebook_id}
GET                       /vocab-items/notebook/{notebook_id}/search?q=...
POST                      /vocab-items/?notebook_id=...
GET/PUT/DELETE            /vocab-items/{vocab_id}

GET                       /reviews/due?limit=20&notebook_id=...
POST                      /learning-sessions
POST                      /learning-sessions/{session_id}/answers
POST                      /learning-sessions/{session_id}/complete
POST                      /learning-sessions/{session_id}/abandon
GET                       /progress/summary

POST                      /game-sessions/start
POST                      /game-sessions/{session_id}/end
GET                       /game-sessions/{session_id}
```

Notebook responses có thêm các aggregate field: `vocab_count`,
`mastered_count`, `due_count`.

Khi đổi route, method, request/response field hay status code public: cập nhật
`API_CONTRACT.md` **trước** rồi mới sửa code hai phía.

## Invariant business logic

1. Không được truy cập resource của user khác, kể cả qua `notebook_id`,
   `vocab_item_id`, `learning_session_id` hay `game_session_id`.
2. Chỉ item đến hạn (`next_review_date <= CURRENT_DATE`) mới được review.
3. Khi submit review, lock learning session và progress row; chặn trả lời cùng
   một vocabulary hai lần trong một session.
4. `score >= 3` là correct; score luôn từ 0 đến 5.
5. Thoát session gọi `abandon`; bắt đầu session mới abandon active session cũ
   của cùng user.
6. Xoá notebook phải abandon session active gắn với notebook trước, nếu không
   `ON DELETE SET NULL` sẽ biến nó thành session cross-notebook sai logic.
7. Không ghi trực tiếp cột generated hoặc cột không tồn tại trong schema.
8. Không coi `is_mastered` là lý do bỏ item khỏi SRS due queue.

## Cách thay đổi an toàn

Trước khi sửa:

1. Chạy test baseline.
2. Tìm mọi chỗ dùng table/field/route bằng `rg`.
3. Xác định thay đổi có phải public API hay database migration không.
4. Giữ thay đổi nhỏ, không refactor lan sang vùng không liên quan.

Sau khi sửa backend:

```powershell
cd backend
.\venv\Scripts\python.exe -m pytest -q
.\venv\Scripts\python.exe -m compileall -q app alembic tests
```

Sau khi sửa frontend:

```powershell
cd frontend
npm.cmd run typecheck
npm.cmd run build
```

Trước khi bàn giao:

```powershell
git diff --check
```

Thêm regression test cho mọi bug runtime, authorization, schedule hoặc schema
mismatch vừa sửa.

## Migration và Supabase live

- Revision `backend/alembic/versions/0003_align_supabase_schema_v2.py` nâng
  database tạo từ Alembic legacy lên schema v2.
- Database Supabase hiện tại đã có trigger/index/RLS đúng v2, nhưng chưa có
  `alembic_version` và còn hai cột legacy dư:
  `learning_sessions.accuracy_percentage`, `game_sessions.created_at`.
- Code hiện tại không đọc/ghi hai cột dư đó. **Không replay `0001/0002` lên
  database live. Revision `0004` thêm unique partial index để mỗi user chỉ có
  một learning session active. **Chỉ stamp/migrate database live khi người sở hữu database
  đồng ý rõ ràng và đã backup.

## Prompt mẫu để gửi AI khác

> Đọc `AI_HANDOFF.md`, `CLAUDE.md`, `ARCHITECTURE.md`, `API_CONTRACT.md` và
> schema SQL Supabase gốc trước khi sửa. Schema SQL là source of truth. Không
> đọc/ghi secret. Không tạo bảng, route, API field hoặc migration mới nếu chưa
> chứng minh cần thiết. Giữ ownership check trong service, không đặt business
> logic trong route. Nếu đổi public API, cập nhật `API_CONTRACT.md` trước. Sau
> thay đổi, chạy backend pytest, frontend typecheck/build (nếu chạm frontend),
> và báo rõ file đã sửa cùng rủi ro còn lại.
