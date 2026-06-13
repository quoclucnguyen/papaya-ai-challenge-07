# AI Challenge 07 — Claims Intake Wizard

Multi-step claim submission wizard (Outpatient / Inpatient / Dental) with conditional
fields & documents per claim type, ICD-10 autocomplete, mock document upload with
progress, full per-step validation and a review step with edit-in-place.

- **Đề bài**: [AI_Challenge_07.md](./AI_Challenge_07.md) · **Plan & phân tích**: [PLAN.md](./PLAN.md)
- **Stack**: React 19 + Vite + TypeScript + zod + Vitest (không backend — mock data toàn bộ)
- **Live URL**: _(điền sau khi deploy lên Vercel/Netlify)_

## Chạy local

```bash
npm install
npm run dev        # http://localhost:5107
npm test           # 45 unit tests (logic thuần)
npm run build      # production build → dist/
```

## Kiến trúc

```
src/
├── schemas/claimSchema.ts   # zod: per-step schemas + discriminatedUnion theo claimType
├── state/                   # TOÀN BỘ logic quyết định — pure TS, không import React
│   ├── wizardReducer.ts     #   state machine của wizard (navigation, reset, upload lifecycle)
│   ├── validateStep.ts      #   validate từng bước + canGoToStep (navigation guard)
│   ├── documentRules.ts     #   ma trận tài liệu required/optional theo claim type
│   ├── dates.ts             #   length-of-stay, kiểm tra ngày hợp lệ/tương lai
│   ├── filterIcd10.ts       #   filter autocomplete (code-prefix xếp trước, giới hạn 20)
│   ├── validateFile.ts      #   PDF/JPG/PNG, ≤ 10MB
│   └── __tests__/           #   45 unit tests
├── data/                    # mock: icd10.json (116 codes), providers.json, member.json
└── components/              # UI thuần render: Wizard, Stepper, 5 steps, Combobox, upload
```

Nguyên tắc: **mọi conditional logic nằm trong `state/` dạng pure function** và được
verify bằng unit test; component chỉ render và dispatch action. Form state nằm ở một
`useReducer` duy nhất tại `Wizard` nên back/forward không bao giờ mất dữ liệu.

## Các quy ước (đề không quy định, tự chốt)

1. **"Major dental"**: thêm field *Dental treatment category* (Preventive / Basic / Major)
   ở Step 3 — chọn **Major** thì *Treatment plan* trở thành **required** ở Step 4,
   ngược lại là optional.
2. **Đổi claim type giữa chừng**: giữ thông tin dùng chung (member, diagnosis, ICD-10,
   provider); reset ngày điều trị, lý do nhập viện, category và **toàn bộ documents đã
   upload** (danh sách tài liệu khác nhau theo type); có confirm dialog trước khi reset.
3. **Upload mô phỏng**: không có backend nên file giữ trong memory + progress giả lập
   (~1.5s). State persist khi back/forward đúng yêu cầu đề; **không** persist qua reload
   trang (đề chỉ yêu cầu "persists across steps").
4. **Length of stay** tính theo **số đêm** (admission 01/06 → discharge 04/06 = 3 nights;
   cùng ngày = "same-day discharge"). Ngày điều trị/nhập viện không được ở tương lai,
   discharge ≥ admission.
5. **ICD-10 phải chọn từ danh sách** (gõ tự do không tính là đã chọn); provider thì
   ngược lại — gợi ý từ mock list nhưng **cho phép nhập tự do** (đúng chữ đề "free text
   with suggestions").

## Đáp ứng tiêu chí chấm

| Tiêu chí | Cách đáp ứng |
|---|---|
| 5 bước + conditional logic đúng | `documentRules` + per-type fields ở Step 3 — test ma trận đầy đủ 3 type × major/non-major |
| Validation chặn submit sai | `validateStep` per step + navigation guard `canGoToStep`; nút Next không disable mà hiện lỗi inline + focus vào lỗi đầu tiên |
| ICD-10 autocomplete 100+ codes | 116 codes, filter mỗi keystroke (<1ms với list cỡ này), render tối đa 20 kết quả, combobox chuẩn WAI-ARIA (↑↓ Enter Esc) |
| Review phản ánh đúng dữ liệu | Step 5 đọc thẳng từ store duy nhất; mỗi section có nút **Edit** → sửa xong "Save & return to review" quay thẳng lại Review |
| Không mất dữ liệu khi back/forward | Form state ở reducer tại `Wizard`, step component không giữ state riêng (trừ text combobox) |
| Responsive | Mobile-first; <700px stepper thu gọn thành "Step x of 5" + progress bar |
| Keyboard accessible | Mỗi step là `<form>` (Enter = tiếp tục), focus chuyển vào heading khi đổi bước, combobox điều khiển bằng phím, `aria-invalid`/`aria-describedby`/`role="alert"` cho lỗi |

Upload validate **cả extension lẫn MIME type** (chặn file giả mạo đuôi), biên 10MB
inclusive; file đang upload dở không tính là đã nộp.

## Test (45 tests, `npm test`)

- `documentRules` — ma trận required/optional 4 case
- `wizardReducer` — đổi claim type (giữ/reset đúng phần), back/forward không mất dữ liệu,
  navigation guard, upload lifecycle, submit chỉ khi mọi bước hợp lệ, edit-từ-review
- `validateStep` — từng bước × từng claim type, gate documents, confirm checkbox
- `dates` / `filterIcd10` / `validateFile` — length of stay, filter & ranking, file rules

## Mock submission

Bấm **Submit claim** → payload được build qua `claimSchema.parse` (zod discriminated
union) và `console.log` ra browser console, sau đó hiện màn hình success với mã tham
chiếu giả lập.
