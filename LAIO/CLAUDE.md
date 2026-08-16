# CLAUDE.md - LAIO AI Handoff

Doc file nay dau tien khi mo phien Claude/Codex moi trong repo LAIO. Hien trang duoc cap nhat ngay 2026-08-16. `CONTEXT_SNAPSHOT.md` la lich su cu, khong phai contract hien tai.

## Source of truth

Thu tu uu tien khi co lech:

1. Code hien tai.
2. `API_CONTRACT.md`.
3. `CONTEXT_SNAPSHOT.md`.
4. `COLLAB_RULES.md`.
5. Cac file docs con lai.

Khong tu tao route/model/co che moi ngoai milestone spec. Neu thay docs lech code, bao ngay trong cau tra loi va cap nhat docs trong cung thay doi neu task cho phep.

## Phan chia ownership

- Backend owner so huu `backend/**`: model, schema, service, route, migration, test backend.
- Frontend owner so huu `frontend/**`: page, component, hook, API client, UI state.
- Khong sua code phia ben kia tru khi user yeu cau truc tiep trong phien do. Neu bat buoc sua cheo ownership, ghi ro trong commit/PR.
- Moi thay doi route/method/request field/response field/status code public phai cap nhat `API_CONTRACT.md` truoc khi code.

## Hien trang code that

- FastAPI mount API tai `/api/v1` trong `backend/app/main.py:17`.
- Router dang mount notebooks, vocab-items, reviews, game-sessions, learning-sessions, progress trong `backend/app/api/v1/router.py:13` den `backend/app/api/v1/router.py:18`.
- Auth backend dung bearer token Supabase. Neu `SUPABASE_JWT_SECRET` co gia tri thi decode local trong `backend/app/api/deps.py:15` den `backend/app/api/deps.py:28`; neu khong thi fallback goi Supabase Auth API trong `backend/app/api/deps.py:30` den `backend/app/api/deps.py:44`.
- `LearningSession` ton tai that: model o `backend/app/core/models/learning_session.py:19`, schemas o `backend/app/schemas/learning.py:10`, service o `backend/app/services/learning_service.py:16`, routes o `backend/app/api/v1/learning_sessions.py:20` den `backend/app/api/v1/learning_sessions.py:58`.
- `VocabProgress` duoc database trigger `trg_vocab_items_create_progress` tao
  dong bo sau khi insert `vocab_items`; application service khong insert row
  thu hai.
- List vocab tra schedule fields qua join `VocabProgress` o `backend/app/services/vocab_service.py:40` den `backend/app/services/vocab_service.py:58`; schema co `next_review_date`, `repetition_count`, `interval_days`, `ease_factor` o `backend/app/schemas/vocab_item.py:46` den `backend/app/schemas/vocab_item.py:49`.
- SM-2 dang duoc goi trong duong learning-session submit; schedule hien tai
  duoc update trong `vocab_progress`, con snapshot ghi dung cac cot schema v2
  `ease_before/ease_after`, `interval_before/interval_after`, va
  `next_review_date_after` trong `review_history`.
- `GET /progress/summary` ton tai o `backend/app/api/v1/progress.py:14`, service tinh counters o `backend/app/services/analytics_service.py:13`.
- Frontend API client canonical la `frontend/src/lib/api.ts`. Pages dung `api.*`, vi du notebooks page import o `frontend/src/app/notebooks/page.tsx:5`, detail page import o `frontend/src/app/notebooks/[id]/page.tsx:20`.
- `useAuth` hoat dong va redirect khi thieu session: `frontend/src/hooks/useAuth.ts:9` den `frontend/src/hooks/useAuth.ts:37`.
- `/dashboard`, `/notebooks`, `/notebooks/[id]`, va `/review` la cac page MVP that. Games/debug khong nam trong navigation MVP.
- API co bounded pagination, rate/body limits, security headers; migration head la `0004`.
- API client chi export domain methods; component khong duoc goi low-level helper.

## Contract dang dung

Doc `API_CONTRACT.md` truoc khi sua bat ky API nao. Tom tat route dang dung:

- Notebooks: `GET/POST /notebooks/`, `GET/PATCH/DELETE /notebooks/{id}` (`PUT` deprecated).
- Vocab: `POST /vocab-items/?notebook_id=...`, `GET /vocab-items/notebook/{notebook_id}`, `GET/PATCH/DELETE /vocab-items/{id}`, `GET /vocab-items/notebook/{notebook_id}/search?q=...` (`PUT` deprecated).
- Reviews: `GET /reviews/due?limit=20&notebook_id=...`.
- Learning: `POST /learning-sessions`, `POST /learning-sessions/{session_id}/answers`, `POST /learning-sessions/{session_id}/complete`, `POST /learning-sessions/{session_id}/abandon`.
- Analytics: `GET /progress/summary`.
- Game sessions: backend route co, frontend hien chua dung.

## Luu y rieng cho Claude: local workspace khac GitHub/main

Repo hien tai dang o branch `Minh_Phat`. Da fetch `origin` ngay 2026-06-24; remote chi co `origin/main`. Theo `git diff origin/main` va untracked files trong workspace, cac thay doi local quan trong so voi GitHub `origin/main` gom:

- Them docs moi: `API_CONTRACT.md`, `ARCHITECTURE.md`, `BACKLOG.md`, `PRODUCT.md`, `README.md`, `COLLAB_RULES.md`, `CONTEXT_SNAPSHOT.md`, va cap nhat lai `CLAUDE.md`, `TECH_DEBT.md`.
- Them CI/workflow va skill folder local: `.github/workflows/ci.yml`, `.general-skill-build/**`.
- Backend them Alembic va tests: `backend/alembic.ini`, `backend/alembic/**`, `backend/pytest.ini`, `backend/tests/**`.
- Backend them learning/progress vertical slice: `backend/app/api/v1/learning_sessions.py`, `backend/app/api/v1/progress.py`, `backend/app/core/models/learning_session.py`, `backend/app/schemas/learning.py`, `backend/app/schemas/progress.py`, `backend/app/services/learning_service.py`, `backend/app/services/analytics_service.py`.
- Backend sua config/auth/db/router/review/vocab/game services: `backend/app/core/config.py`, `backend/app/api/deps.py`, `backend/app/api/v1/router.py`, `backend/app/services/review_service.py`, `backend/app/services/vocab_service.py`, `backend/requirements.txt`.
- Frontend sua API client typed + auth guard + learning flow: `frontend/src/lib/api.ts`, `frontend/src/hooks/useAuth.ts`, `frontend/src/app/notebooks/page.tsx`, `frontend/src/app/notebooks/[id]/page.tsx`, `frontend/src/app/notebooks/[id]/components/StudyMode.tsx`, `frontend/src/app/notebooks/[id]/components/AddVocabModal.tsx`.
- Frontend co dashboard/review MVP that; game con ngoai pham vi va khong nam trong core navigation.

Neu user noi "so voi GitHub", dung danh sach tren lam canh bao: dung gia dinh GitHub/main da co cac file nay tru khi da fetch/pull va xac nhan.

## Definition of done

- Backend: chay pytest neu task cham backend va moi truong cho phep; neu sua route thi curl/Swagger thu cong it nhat 1 lan.
- Frontend: chay `npm run typecheck` va `npm run build`; click UI that voi flow vua sua.
- Public contract doi: cap nhat `API_CONTRACT.md` truoc khi code.
- Phat hien/giai quyet no ky thuat: cap nhat `TECH_DEBT.md`.
