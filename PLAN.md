# AI Challenge 07 — Claims Intake Wizard: Phân tích & Plan triển khai

> Đề bài: `pumpkin/AI_Engineering_Challenges/AI_Challenge_07.md` (đã copy vào folder này).
> Công nghệ chọn: **ReactJS** (Vite + TypeScript + Vitest + zod), nhất quán với challenge-04/05/06.
> Tài liệu này chỉ là **plan** — chưa có code.

---

## 1. Phân tích bài toán

### 1.1. Bản chất bài toán

Đây là bài toán **multi-step form (wizard) với conditional logic** — khác hẳn
challenge-05 (hiển thị) và challenge-06 (engine tính toán): không có thuật toán phức tạp,
độ khó nằm ở **quản lý form state + validation theo ngữ cảnh + UX**. Các trục chấm điểm
của đề đều xoay quanh:

1. **Conditional logic đúng theo claim type** — claim type chọn ở Step 1 quyết định
   field ở Step 3 và document ở Step 4.
2. **Không mất dữ liệu khi back/forward** — form state phải sống xuyên suốt các bước,
   không gắn vào lifecycle của từng step component.
3. **Validation chặn submit sai** — thiếu field, sai file type, thiếu document bắt buộc.
4. **Autocomplete ICD-10 hiệu năng tốt** trên 100+ codes.
5. **Review step phản ánh chính xác** mọi dữ liệu đã nhập + cho phép quay lại sửa.
6. Responsive + keyboard accessible.

Không có backend: dữ liệu member/dependents/providers/ICD-10 là mock JSON, upload là
mô phỏng, submit là log console / success screen.

### 1.2. Ma trận conditional theo claim type

Đây là "single source of truth" của toàn bộ conditional logic — sẽ được code hóa thành
config thuần (không if/else rải rác trong component) để test được:

| | Outpatient | Inpatient | Dental |
|---|---|---|---|
| **Treatment date (Step 3)** | 1 ngày | **khoảng ngày** (admission → discharge) | 1 ngày |
| **Field riêng (Step 3)** | — | admission reason, length of stay (**auto-calc** từ date range) | loại điều trị nha khoa (xem §1.3-1) |
| **Docs required (Step 4)** | medical receipt | discharge summary, itemized bill, medical receipt | dental receipt (+ treatment plan **nếu major**) |
| **Docs optional (Step 4)** | prescription | — | treatment plan (nếu không phải major) |

### 1.3. Điểm mờ của đề — phải chốt quy ước trước khi code

Đề có 4 chỗ không quy định rõ, mỗi chỗ tôi chốt một quy ước và sẽ ghi vào README:

1. **"Major dental" là gì?** Đề yêu cầu treatment plan *"required for major dental"*
   nhưng không định nghĩa khi nào là major. → Thêm field **"Dental treatment category"**
   (Preventive / Basic / Major — phân loại chuẩn của bảo hiểm nha khoa) vào Step 3 khi
   claim type = Dental; giá trị này điều khiển required docs ở Step 4.
2. **Đổi claim type giữa chừng thì dữ liệu đã nhập làm gì?** (Đề không nói, nhưng chắc
   chắn bị tester bấm thử.) → **Giữ** dữ liệu dùng chung (member/policy, diagnosis,
   ICD-10, provider); **reset** phần type-specific (dates, admission reason, dental
   category) và **toàn bộ documents đã upload** (vì danh sách docs khác nhau); hiện
   confirm dialog cảnh báo trước khi reset nếu đã có dữ liệu sẽ mất.
3. **Upload không có backend** → giữ `File` object trong memory + simulate progress
   bằng timer. Hệ quả: state form persist khi back/forward (đúng yêu cầu đề) nhưng
   **không persist qua refresh trang** — đề chỉ yêu cầu "persists across steps", không
   yêu cầu qua reload; ghi rõ giới hạn này trong README.
4. **Khoảng ngày inpatient hợp lệ**: discharge ≥ admission; length of stay =
   `discharge − admission` tính theo **số đêm** (admission 01/03, discharge 04/03 → 3
   ngày) — quy ước phổ biến của bệnh viện; cùng ngày → "Same-day discharge (0 nights)".
   Treatment dates không được ở tương lai.

### 1.4. Các quyết định thiết kế chính

- **Form state**: một store duy nhất `useReducer` + React Context — state nằm ở Wizard
  cha, step components chỉ render + dispatch → back/forward không mất dữ liệu là hệ quả
  tự nhiên của kiến trúc, không phải tính năng phải "vá". Không cần thư viện form
  (react-hook-form) — wizard này validation theo bước, tự kiểm soát bằng zod đơn giản
  và dễ test hơn.
- **Validation**: zod schema **per step**, riêng claim được model bằng
  `z.discriminatedUnion("claimType", …)` cho phần type-specific. Hàm pure
  `validateStep(stepId, state) → errors` để unit test không cần render. Nút **Next
  không disable** — cho phép bấm rồi hiển thị lỗi inline + focus vào lỗi đầu tiên
  (pattern accessible hơn disabled button, người dùng hiểu vì sao chưa đi tiếp được).
- **Navigation guard**: Back luôn cho phép; Next/nhảy stepper về phía trước chỉ khi mọi
  step trước đó valid. Từ Review (Step 5) có link "Edit" về từng section → sửa xong nút
  "Back to review" quay thẳng lại Step 5.
- **ICD-10 combobox**: theo WAI-ARIA combobox pattern (`role="combobox"` +
  `listbox`, điều hướng ↑/↓/Enter/Esc, `aria-activedescendant`). Filter substring
  case-insensitive trên cả code lẫn description; 100+ items thì filter trực tiếp mỗi
  keystroke là đủ nhanh (<1ms), chỉ cần giới hạn render ~20 kết quả đầu — **không cần**
  debounce/virtualization (sẽ là over-engineering, nhưng ghi chú trong README hướng mở
  rộng nếu list lên 10k codes).
- **Provider input**: cùng combobox đó nhưng **cho phép giá trị tự do** (đề: "free text
  with suggestions") — khác ICD-10 (phải chọn từ list).
- **Upload**: mỗi document type là một "slot" (required/optional badge) — chọn file qua
  input hoặc drag-drop; validate extension + MIME (`pdf/jpg/jpeg/png`) và size ≤ 10MB
  **trước khi** "upload"; progress bar mô phỏng (timer ~1.5s); trạng thái slot:
  `empty → uploading → done | error`, cho phép remove/replace. Gate sang Step 5: mọi
  slot required ở trạng thái `done`.
- **Accessibility**: mỗi step là một `<form>` (Enter = submit = Next); khi đổi step,
  focus chuyển vào heading của step (`tabIndex={-1}`); stepper có `aria-current="step"`;
  error gắn field qua `aria-describedby` + `aria-invalid`.
- **Responsive**: mobile-first; stepper ngang đầy đủ trên desktop, thu gọn thành
  "Bước 2/5 — Member & Policy" + progress bar trên mobile.

---

## 2. Kiến trúc

```
answers/challenge-07/
├── src/
│   ├── schemas/                    ← zod — single source of truth (pattern ch-05/06)
│   │   └── claimSchema.ts          # per-step schemas + discriminatedUnion theo claimType
│   ├── state/                      ← PURE TypeScript, KHÔNG import React
│   │   ├── types.ts                # ClaimDraft, StepId, DocumentSlotState…
│   │   ├── wizardReducer.ts        # reducer: setField, changeClaimType (reset có chủ đích),
│   │   │                           #   goToStep, attach/removeDocument…
│   │   ├── validateStep.ts         # (stepId, state) → FieldErrors
│   │   └── documentRules.ts        # (claimType, dentalCategory) → {required[], optional[]}
│   ├── state/__tests__/            # Vitest — toàn bộ logic pure test ở đây
│   ├── data/
│   │   ├── icd10.json              # ≥100 ICD-10 codes phổ biến {code, description}
│   │   ├── providers.json          # mock danh sách bệnh viện/phòng khám
│   │   └── member.json             # member + policy + dependents (pre-fill Step 2)
│   ├── components/
│   │   ├── Wizard.tsx              # context provider + render step hiện tại
│   │   ├── Stepper.tsx             # progress indicator, aria-current
│   │   ├── steps/                  # Step1ClaimType … Step5Review (mỗi step 1 file)
│   │   ├── fields/                 # Combobox (dùng chung ICD-10 + provider), DateRange…
│   │   └── upload/                 # DocumentSlot, simulateUpload, ProgressBar
│   └── App.tsx
├── AI_Challenge_07.md              # đề (copy)
├── PLAN.md                         # file này
└── README.md                       # quy ước (§1.3), cách chạy, test results, live URL
```

Nguyên tắc then chốt (kế thừa ch-06): **mọi logic quyết định — reducer, validation,
document rules, length-of-stay, filter ICD-10, file validation — là pure function trong
`state/`, không import React**. Components chỉ là tầng render. Nhờ vậy phần "conditional
logic per claim type" (tiêu chí chấm số 1) được verify bằng unit test thay vì click tay.

---

## 3. Chiến lược test — test-first phần nào?

Bài này UI-heavy nên **không TDD toàn bộ** (khác ch-06 vốn là engine thuần). Áp dụng
nguyên tắc: **test-first cho logic pure trong `state/`, verify bằng preview cho UI.**

### Danh sách unit test (Vitest, trên module pure)

1. `documentRules`: đủ ma trận §1.2 — 3 claim type × (dental: major/không major) → đúng
   required/optional từng case
2. `wizardReducer` — đổi claim type: giữ field chung, reset field type-specific + documents
3. `wizardReducer` — back/forward không mất dữ liệu (set field → go back → go forward → còn nguyên)
4. `validateStep` Step 2: thiếu member name/policy number → lỗi; claim cho dependent mà
   chưa chọn dependent → lỗi
5. `validateStep` Step 3 outpatient/dental: thiếu ngày, ngày tương lai → lỗi
6. `validateStep` Step 3 inpatient: discharge < admission → lỗi; thiếu admission reason → lỗi
7. Length of stay: auto-calc đúng (kể cả same-day = 0)
8. ICD-10 filter: match theo code ("E11") và theo description ("diabetes"),
   case-insensitive, giới hạn 20 kết quả
9. File validation: đúng type qua, sai type (docx) bị chặn, >10MB bị chặn,
   JPG 10MB đúng biên qua
10. Gate Step 4: thiếu 1 required doc → không cho sang Step 5; đủ required, thiếu
    optional → cho qua
11. Navigation guard: không thể nhảy tới step N khi step N−1 invalid

### Checklist verify UI bằng tay/preview (không viết UI test)

- Tab xuyên suốt cả 5 bước không cần chuột; Enter để Next; combobox điều khiển được bằng phím
- Review hiển thị đúng 100% dữ liệu cả 3 claim type; Edit → sửa → quay lại Review đúng chỗ
- Mobile 375px: stepper thu gọn, form không tràn ngang; Desktop 1280px
- Upload: progress chạy, file sai type/size báo lỗi rõ ràng, remove/replace hoạt động

---

## 4. Các bước triển khai & timeline ước tính

| # | Bước | Sản phẩm | Ước tính |
|---|---|---|---|
| 1 | Scaffold Vite + React + TS (port 5107), sinh mock data: `icd10.json` (≥100 codes), `providers.json`, `member.json` | repo chạy được, `data/` | 30′ |
| 2 | Chốt types + zod schemas + **test-first** `documentRules`, `validateStep`, `wizardReducer` | `state/` + `schemas/` + ~11 tests xanh | 60–75′ |
| 3 | Wizard shell: Context, Stepper, navigation guard, focus management | khung 5 bước điều hướng được | 45′ |
| 4 | Step 1–3 UI: chọn claim type (+confirm reset), member/dependent pre-fill, diagnosis + ICD-10 combobox + provider + dates (single/range + LOS) | 3 step hoàn chỉnh | 60′ |
| 5 | Step 4 upload: DocumentSlot theo `documentRules`, validate file, progress mô phỏng, gate | step 4 hoàn chỉnh | 45′ |
| 6 | Step 5 review: summary theo section + Edit links + confirm checkbox + mock submit | flow end-to-end | 30′ |
| 7 | Responsive + a11y pass + chạy checklist §3 trên cả 3 claim type | UI polish | 30′ |
| 8 | README (quy ước §1.3, cách chạy, test results), build, **deploy Vercel/Netlify + push GitHub** | live URL + repo | 30′ |

**Tổng: ~4.5–5h** — khớp khung "Intermediate · 3–5 hours" của đề.

### Thứ tự quan trọng

- Bước 2 **trước** mọi UI: conditional logic và reducer phải xanh test trước, vì đây là
  thứ đề chấm nặng nhất và cũng là thứ dễ sai nhất khi để AI sinh UI ồ ạt — test là hợp
  đồng để điều khiển AI tool (tiêu chí *"direct the AI tool effectively"*).
- Mock data (bước 1) làm sớm vì ICD-10 list 100+ codes là việc AI generate tốt nhưng
  cần review chính tả code (E11.9, J06.9…) trước khi mọi thứ phụ thuộc vào nó.
- Deploy (bước 8) để cuối nhưng **không làm phút chót**: deploy bản skeleton ngay sau
  bước 3 để chắc pipeline hosting chạy, cuối chỉ cần push lại.
