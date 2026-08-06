# TECH_DEBT.md - LAIO

Cap nhat ngay 2026-06-24 dua tren doc code that trong workspace hien tai. Nhieu muc debt cu da loi thoi vi local branch `Minh_Phat` da co them learning sessions, progress summary, Alembic, tests, typed API client va auth guard. Khong dung file nay de suy dien contract; khi sua API doc `API_CONTRACT.md` truoc.

## Blocker

Xac nhan thuc te luc 2026-06-24 20:09:31 +07:00:
- `backend`: da chay `.\venv\Scripts\python.exe -m pip install -r requirements.txt` va `.\venv\Scripts\python.exe -m pytest -v`.
- Ket qua pytest that: `17 passed, 0 failed, 0 errors, 0 skipped` trong `3.52s`.
- Auth verification end-to-end voi user token that hien dang bi chan boi project auth config: `backend/.env` khong co `SUPABASE_JWT_SECRET`; `signup` qua Supabase publishable key tao user duoc nhung khong tra session token; `password grant` tra `400 email_not_confirmed`; `SUPABASE_SERVICE_KEY` trong `.env` khong dung duoc voi Admin API (`401 Invalid API key`), nen chua lay duoc access token that de ket luan bang request 200/401 tren route auth.

Frontend build da chay that bang `npm run build` trong `frontend/` ngay 2026-06-24 va pass. Cac page `/dashboard`, `/games`, `/review` hien redirect ve `/notebooks`, khong con la file rong.

Kiem tra lai schema-contract ngay 2026-08-05: backend `31 passed`, frontend
typecheck pass, va Alembic offline SQL sinh thanh cong den revision `0003`.

## Cao

### 1. Game session route chua co frontend usage va chua duoc chot san pham

- Backend co `POST /game-sessions/start`, `POST /game-sessions/{session_id}/end`, `GET /game-sessions/{session_id}` trong `backend/app/api/v1/game_sessions.py:17`, `backend/app/api/v1/game_sessions.py:33`, `backend/app/api/v1/game_sessions.py:53`.
- Frontend `/games` hien chi redirect ve `/notebooks` o `frontend/src/app/games/page.tsx:1` den `frontend/src/app/games/page.tsx:5`.
- `frontend/src/lib/api.ts:144` den `frontend/src/lib/api.ts:206` khong co domain method cho game session.
- Viec can lam: hoac dua game sessions vao milestone rieng co UI/API contract, hoac ghi ro no la secondary backend surface chua dung.

### 2. Search vocab backend unused

- Backend co `GET /vocab-items/notebook/{notebook_id}/search?q=...` o `backend/app/api/v1/vocab_items.py:28`.
- UI detail page loc client-side o `frontend/src/app/notebooks/[id]/page.tsx:120` den `frontend/src/app/notebooks/[id]/page.tsx:126`.
- Viec can lam: neu vocabulary list lon, chot contract de UI dung search endpoint; neu khong can, giu note la unused route.

### 3. Auth local JWT branch can duoc test voi config that

- Backend co 2 nhanh verify token: local JWT decode khi co `SUPABASE_JWT_SECRET` o `backend/app/api/deps.py:15` den `backend/app/api/deps.py:28`, fallback Supabase Auth API o `backend/app/api/deps.py:30` den `backend/app/api/deps.py:44`.
- Kiem tra that ngay 2026-06-24 20:09:31 +07:00:
  `backend/.env` khong co dong `SUPABASE_JWT_SECRET`, va shell env cua tien trinh dang chay cung khong set `SUPABASE_JWT_SECRET`.
  Theo code hien tai, dieu nay buoc `verify_supabase_token()` di vao nhanh fallback Supabase Auth API, khong vao nhanh local HS256 decode.
  Da thu lay access token that bang Supabase Auth API: `signup` voi publishable key tra `200` nhung chi tao user chua confirm email; `POST /auth/v1/token?grant_type=password` tra `400 email_not_confirmed`; thu dung `SUPABASE_SERVICE_KEY` trong `.env` de tao user confirmed qua Admin API tra `401 Invalid API key`.
  Da goi `GET /api/v1/notebooks/` tren backend local bang token khong hop le va nhan `401 {"detail":"Invalid authentication token"}`; ket qua nay phu hop voi nhanh fallback dang reject token, nhung chua du de xac nhan duong 200 voi user token that.
- Viec can lam: can mot test account da confirm email hoac service/admin key hop le de lay access token that va chot hoan toan flow auth route.

## Trung

### 4. Live Supabase con hai cot legacy du, chua co Alembic version

- Kiem tra read-only ngay 2026-08-05 cho thay
  `learning_sessions.accuracy_percentage` va `game_sessions.created_at` con ton
  tai ngoai schema v2 goc. Code khong con doc/ghi hai cot nay; ca hai co default
  nen khong chan insert.
- Database live khong co `alembic_version`. Khong chay replay `0001/0002` tren
  database nay. Chi stamp `0003` sau khi da chot quy trinh ownership migration;
  viec drop hai cot du la cleanup tuy chon, khong can de application hoat dong.

### 5. API client canonical con export low-level helpers

- `frontend/src/lib/api.ts:115` den `frontend/src/lib/api.ts:141` export `get`, `post`, `put`, `patch`, `del`.
- Pages hien dung `api.*` domain methods: notebooks page o `frontend/src/app/notebooks/page.tsx:5`, detail page o `frontend/src/app/notebooks/[id]/page.tsx:20`.
- Rui ro: AI/nguoi sau import low-level helpers truc tiep trong component, lam lech contract canonical.
- Viec can lam: neu muon enforce chat, khong export low-level helpers hoac them lint rule; hien tai `COLLAB_RULES.md` da cam page/component goi truc tiep.

### 6. Quick actions UI la nut hien thi, chua co behavior

- `QuickActions` liet ke grammar/pronunciation/OCR/draw o `frontend/src/app/notebooks/[id]/components/QuickActions.tsx:8` den `frontend/src/app/notebooks/[id]/components/QuickActions.tsx:12`.
- Buttons render o `frontend/src/app/notebooks/[id]/components/QuickActions.tsx:20` den `frontend/src/app/notebooks/[id]/components/QuickActions.tsx:26`, nhung khong co `onClick`.
- Viec can lam: hoac an/disable cac action nay, hoac tao milestone rieng voi API/UI contract ro.

### 7. Root docs va GitHub state can duoc dong bo truoc khi nguoi khac doc

- Nhieu docs hien la untracked local files theo `git status`, gom `API_CONTRACT.md`, `ARCHITECTURE.md`, `BACKLOG.md`, `PRODUCT.md`, `README.md`, `COLLAB_RULES.md`, `CONTEXT_SNAPSHOT.md`, `CLAUDE.md`, `TECH_DEBT.md`.
- Neu Claude/ban frontend doc GitHub/main truc tiep, co the khong thay cac docs va code local moi.
- Viec can lam: commit/push docs cung code lien quan, hoac noi ro cho nguoi con lai rang local branch `Minh_Phat` la source of truth tam thoi.

## Thap

### 8. File legacy/rong van con gay nhieu khi doc repo

- Backend van co cac file tracked legacy nhu `backend/app/api/ai_features.py`, `backend/app/api/auth.py`, `backend/app/api/games.py`, `backend/app/api/vocab.py`, `backend/app/services/google_tts.py`, `backend/app/services/llm_service.py`, `backend/app/schemas/auth_schema.py`, `backend/app/schemas/vocab_schema.py`.
- Chung khong nam trong router v1 hien tai; route v1 that duoc mount trong `backend/app/api/v1/router.py:13` den `backend/app/api/v1/router.py:18`.
- Viec can lam: xoa hoac them comment "legacy/unused" khi co milestone cleanup.

## Da giai quyet / muc cu khong con dung

- `LearningSession` khong ton tai: sai voi code hien tai. Model o `backend/app/core/models/learning_session.py:19`; route o `backend/app/api/v1/learning_sessions.py:20`.
- `/progress/summary` khong ton tai: sai. Route o `backend/app/api/v1/progress.py:14`.
- `useAuth.ts` rong: sai. Hook o `frontend/src/hooks/useAuth.ts:9` den `frontend/src/hooks/useAuth.ts:37`.
- `/dashboard`, `/games`, `/review` rong lam build fail: sai. Cac page redirect ve `/notebooks`.
- `VocabItemResponse` thieu schedule fields: sai. Fields o `backend/app/schemas/vocab_item.py:46` den `backend/app/schemas/vocab_item.py:49`.
- Supabase schema drift: da can chinh model/service theo schema v2, them revision
  `0003_align_supabase_schema_v2.py` cho database tao tu Alembic legacy, va them
  schema-contract tests. Database da tao truc tiep tu SQL v2 can duoc stamp tai
  `0003`, khong replay `0001/0002` len schema san co.
- Tao vocab khong tao `VocabProgress`: database v2 tao bang trigger
  `trg_vocab_items_create_progress`; application co y khong INSERT row thu hai
  de tranh vi pham unique `(vocab_item_id, user_id)`.
- `review_service.py` async/sync mismatch: sai voi code hien tai. Service la sync o `backend/app/services/review_service.py:14` va `backend/app/services/review_service.py:56`.
- `api.ts` hard-code Supabase localStorage token: sai voi code hien tai. Token lay qua `supabase.auth.getSession()` o `frontend/src/lib/api.ts:84` den `frontend/src/lib/api.ts:92`.
- Giao dien "mat" (reset ve loading skeleton hoac hien banner "Load failed")
  moi lan chuyen tab/app roi quay lai: da fix ngay 2026-08-06.
  Nguyen nhan goc: `supabase.auth.onAuthStateChange` phat `TOKEN_REFRESHED`
  voi mot `session.user` object moi (reference khac) moi khi tab lay lai
  focus, ke ca khi van la cung mot user; cac page (`dashboard`, `notebooks`,
  `notebooks/[id]`, `review`) deu co `user` trong dependency cua
  `useEffect` nen effect fetch data chay lai va reset UI ve loading moi lan
  quay lai tab. `frontend/src/hooks/useAuth.ts` da sua de giu nguyen
  reference cua `user` khi `user.id` khong doi. Rieng
  `frontend/src/app/notebooks/page.tsx` con mot bug thu hai lam banner loi
  hien sai: `catch` block goi `setError(...)` truoc khi kiem tra
  `signal?.aborted`, nen request bi abort (do effect chay lai) van hien
  "Load failed" de len tren du lieu vua tai thanh cong; da doi thu tu kiem
  tra `aborted` len truoc.
