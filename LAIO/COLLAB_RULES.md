# COLLAB_RULES.md

Quy uoc lam viec cho LAIO khi 2 nguoi va 2 AI cung code. File nay la quy tac thao tac, khong phai mo ta tinh nang.

## 1. Ranh gioi so huu

- Backend owner so huu `backend/**`: model, schema, service, route, migration, test backend. Vi du route that dang mount nam o `backend/app/api/v1/router.py:13` den `backend/app/api/v1/router.py:18`.
- Frontend owner so huu `frontend/**`: page, component, hook, API client, UI state. Vi du API client canonical hien tai nam o `frontend/src/lib/api.ts:3` den `frontend/src/lib/api.ts:206`.
- Khong ai sua code phia ben kia tru khi duoc yeu cau truc tiep trong phien do. Neu co sua cheo ownership, phai noi ro trong PR/commit message: sua file nao, vi sao can sua, contract nao bi anh huong.
- Khong "tien tay" sua code ben kia khi dang doc thay no sai. Ghi vao `TECH_DEBT.md` hoac file milestone, roi chot voi nguoi con lai.

## 2. Quy tac thay doi contract

- Bat ky thay doi route, HTTP method, request field, response field, status code public nao deu phai duoc ghi vao `API_CONTRACT.md` truoc khi code.
- Nguoi phia kia phai doc va xac nhan hieu contract truoc khi ca hai code song song.
- Khong co ngoai le "tien the doi luon".
- Vi du contract hien tai phai doc tu code: `/api/v1` duoc mount o `backend/app/main.py:17`, cac router con duoc include o `backend/app/api/v1/router.py:13` den `backend/app/api/v1/router.py:18`, va frontend dang goi qua `frontend/src/lib/api.ts:150` den `frontend/src/lib/api.ts:205`.

## 3. Nhanh git

- Mot nhanh git = mot milestone nho, song toi da 1-2 ngay.
- Khong cho phep mot nguoi giu branch rieng chay song song vo thoi han.
- Truoc khi tach nhanh song song, chot `API_CONTRACT.md` va doc lai cac file lien quan.

## 4. Mo dau moi phien AI

Moi phien Claude/Codex moi phai duoc mo dau bang:

1. Spec milestone dang lam.
2. Doan `API_CONTRACT.md` lien quan.
3. Cau chi thi ro: "khong tu tao route/model/co che moi ngoai spec nay".

Ly do: AI co xu huong tu them co che song song neu khong bi chan ro. Repo tung co tai lieu mo ta 3 co che review song song trong `CLAUDE.md:319` den `CLAUDE.md:349`; code hien tai da co co che LearningSession that o `backend/app/api/v1/learning_sessions.py:20` den `backend/app/api/v1/learning_sessions.py:58`, nen cang phai chot contract truoc khi sua tiep.

## 5. Kiem tra tay truoc khi bao xong

- Backend: nguoi vua sua phai tu goi route bang curl/Swagger it nhat 1 lan voi token that neu route yeu cau auth. Tat ca product route dung `get_current_user` qua dependency, vi du `backend/app/api/v1/notebooks.py:13`, `backend/app/api/v1/vocab_items.py:21`, `backend/app/api/v1/learning_sessions.py:24`.
- Frontend: nguoi vua sua phai click UI that it nhat 1 lan, khong chi tin loi AI noi da xong. Cac luong UI that dang goi API o `frontend/src/app/notebooks/page.tsx:25` den `frontend/src/app/notebooks/page.tsx:27` va `frontend/src/app/notebooks/[id]/page.tsx:44` den `frontend/src/app/notebooks/[id]/page.tsx:215`.

## 6. API client canonical

- API client canonical duy nhat la `frontend/src/lib/api.ts`.
- Cam goi `fetch`/`get`/`post` truc tiep trong page/component. Page/component phai goi domain method tren `api`, nhu `api.getNotebooks()` o `frontend/src/app/notebooks/page.tsx:26` hoac `api.submitLearningAnswer()` o `frontend/src/app/notebooks/[id]/page.tsx:205`.
- `fetch` chi duoc nam trong helper request cua API client, hien tai o `frontend/src/lib/api.ts:95` den `frontend/src/lib/api.ts:113`.
- Neu gap code cu vi pham quy tac nay, ghi vao `TECH_DEBT.md` va khong tu sua ngoai pham vi task dang lam.

## 7. Checklist truoc khi merge

- Backend pytest pass neu co test. Hien repo co backend tests trong `backend/tests/` theo trang thai filesystem hien tai; route OpenAPI learning/progress duoc test o `backend/tests/integration/test_api_surface.py:14` den `backend/tests/integration/test_api_surface.py:16`.
- Frontend typecheck pass: script `typecheck` nam o `frontend/package.json:65`.
- Frontend build pass: script `build` nam o `frontend/package.json:63`.
- `API_CONTRACT.md` da cap nhat neu hanh vi public doi.
- `TECH_DEBT.md` da cap nhat neu phat hien no ky thuat moi hoac giai quyet no cu.
- Neu sua API, doi chieu lai backend route voi usage frontend trong `frontend/src/lib/api.ts:150` den `frontend/src/lib/api.ts:205`.

## 8. Giao tiep giua 2 AI

- Neu Claude hoac Codex phat hien lech giua tai lieu va code, hoac giua backend va frontend, phai bao ra ngay trong cau tra loi.
- Khong tu am tham chon 1 phuong an roi code tiep khi contract chua ro.
- Vi du lech can bao ngay: `CLAUDE.md:563` noi `LearningSession` chua viet, nhung code co model o `backend/app/core/models/learning_session.py:19`, route o `backend/app/api/v1/learning_sessions.py:20`, service o `backend/app/services/learning_service.py:16`, va frontend goi o `frontend/src/lib/api.ts:177`.
