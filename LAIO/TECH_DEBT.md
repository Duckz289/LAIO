# TECH_DEBT.md - LAIO

Cap nhat ngay 2026-06-24 dua tren doc code that trong workspace hien tai. Nhieu muc debt cu da loi thoi vi local branch `Minh_Phat` da co them learning sessions, progress summary, Alembic, tests, typed API client va auth guard. Khong dung file nay de suy dien contract; khi sua API doc `API_CONTRACT.md` truoc.

## Blocker

Hien chua ghi nhan blocker doc-code nao trong snapshot nay.

Frontend build da chay that bang `npm run build` trong `frontend/` ngay 2026-06-24 va pass. Cac page `/dashboard`, `/games`, `/review` hien redirect ve `/notebooks`, khong con la file rong.

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
- Can xac nhan bang token Supabase that xem project dang dung HS256 hay asymmetric/JWKS. Neu khong khop, local decode se 401 va fallback khong chay vi code return/raise trong branch secret.
- Viec can lam: test manual voi env that, hoac chot chi dung fallback network cho den khi JWKS/secret duoc xac nhan.

## Trung

### 4. API client canonical con export low-level helpers

- `frontend/src/lib/api.ts:115` den `frontend/src/lib/api.ts:141` export `get`, `post`, `put`, `patch`, `del`.
- Pages hien dung `api.*` domain methods: notebooks page o `frontend/src/app/notebooks/page.tsx:5`, detail page o `frontend/src/app/notebooks/[id]/page.tsx:20`.
- Rui ro: AI/nguoi sau import low-level helpers truc tiep trong component, lam lech contract canonical.
- Viec can lam: neu muon enforce chat, khong export low-level helpers hoac them lint rule; hien tai `COLLAB_RULES.md` da cam page/component goi truc tiep.

### 5. Quick actions UI la nut hien thi, chua co behavior

- `QuickActions` liet ke grammar/pronunciation/OCR/draw o `frontend/src/app/notebooks/[id]/components/QuickActions.tsx:8` den `frontend/src/app/notebooks/[id]/components/QuickActions.tsx:12`.
- Buttons render o `frontend/src/app/notebooks/[id]/components/QuickActions.tsx:20` den `frontend/src/app/notebooks/[id]/components/QuickActions.tsx:26`, nhung khong co `onClick`.
- Viec can lam: hoac an/disable cac action nay, hoac tao milestone rieng voi API/UI contract ro.

### 6. Root docs va GitHub state can duoc dong bo truoc khi nguoi khac doc

- Nhieu docs hien la untracked local files theo `git status`, gom `API_CONTRACT.md`, `ARCHITECTURE.md`, `BACKLOG.md`, `PRODUCT.md`, `README.md`, `COLLAB_RULES.md`, `CONTEXT_SNAPSHOT.md`, `CLAUDE.md`, `TECH_DEBT.md`.
- Neu Claude/ban frontend doc GitHub/main truc tiep, co the khong thay cac docs va code local moi.
- Viec can lam: commit/push docs cung code lien quan, hoac noi ro cho nguoi con lai rang local branch `Minh_Phat` la source of truth tam thoi.

## Thap

### 7. File legacy/rong van con gay nhieu khi doc repo

- Backend van co cac file tracked legacy nhu `backend/app/api/ai_features.py`, `backend/app/api/auth.py`, `backend/app/api/games.py`, `backend/app/api/vocab.py`, `backend/app/services/google_tts.py`, `backend/app/services/llm_service.py`, `backend/app/schemas/auth_schema.py`, `backend/app/schemas/vocab_schema.py`.
- Chung khong nam trong router v1 hien tai; route v1 that duoc mount trong `backend/app/api/v1/router.py:13` den `backend/app/api/v1/router.py:18`.
- Viec can lam: xoa hoac them comment "legacy/unused" khi co milestone cleanup.

## Da giai quyet / muc cu khong con dung

- `LearningSession` khong ton tai: sai voi code hien tai. Model o `backend/app/core/models/learning_session.py:19`; route o `backend/app/api/v1/learning_sessions.py:20`.
- `/progress/summary` khong ton tai: sai. Route o `backend/app/api/v1/progress.py:14`.
- `useAuth.ts` rong: sai. Hook o `frontend/src/hooks/useAuth.ts:9` den `frontend/src/hooks/useAuth.ts:37`.
- `/dashboard`, `/games`, `/review` rong lam build fail: sai. Cac page redirect ve `/notebooks`.
- `VocabItemResponse` thieu schedule fields: sai. Fields o `backend/app/schemas/vocab_item.py:46` den `backend/app/schemas/vocab_item.py:49`.
- Tao vocab khong tao `VocabProgress`: sai. Tao progress o `backend/app/services/vocab_service.py:24`.
- `review_service.py` async/sync mismatch: sai voi code hien tai. Service la sync o `backend/app/services/review_service.py:14` va `backend/app/services/review_service.py:56`.
- `api.ts` hard-code Supabase localStorage token: sai voi code hien tai. Token lay qua `supabase.auth.getSession()` o `frontend/src/lib/api.ts:84` den `frontend/src/lib/api.ts:92`.
