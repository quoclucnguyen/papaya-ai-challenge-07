# Challenge 07 — Checklist đối chiếu yêu cầu

> Đối chiếu [AI_Challenge_07.md](./AI_Challenge_07.md) với implementation thực tế.
> Trạng thái kiểm tra: **45/45 unit test pass**, `tsc` + `vite build` thành công.

Chú thích: ✅ Đạt · ⚠️ Đạt nhưng cần lưu ý · ❌ Chưa làm

---

## Step 1 — Claim Type Selection

| # | Yêu cầu | Trạng thái | Bằng chứng |
|---|---|---|---|
| 1.1 | 3 lựa chọn: Outpatient / Inpatient / Dental | ✅ | [Step1ClaimType.tsx](src/components/steps/Step1ClaimType.tsx) + `CLAIM_TYPE_LABELS` |
| 1.2 | Lựa chọn quyết định field & document các bước sau | ✅ | [documentRules.ts](src/state/documentRules.ts), nhánh theo `claimType` ở [Step3](src/components/steps/Step3Diagnosis.tsx) / [Step4](src/components/steps/Step4Documents.tsx) |

## Step 2 — Member & Policy Information

| # | Yêu cầu | Trạng thái | Bằng chứng |
|---|---|---|---|
| 2.1 | Pre-fill từ mock data, editable: name, policy number, member ID, DOB | ✅ | [member.json](src/data/member.json) → `createInitialDraft` ([wizardReducer.ts:30](src/state/wizardReducer.ts:30)); 4 input editable [Step2Member.tsx](src/components/steps/Step2Member.tsx) |
| 2.2 | Dependent selector khi claim cho người phụ thuộc | ✅ | Checkbox `isForDependent` + `<select>` 3 dependents từ mock [Step2Member.tsx:58](src/components/steps/Step2Member.tsx:58) |

## Step 3 — Diagnosis & Treatment

| # | Yêu cầu | Trạng thái | Bằng chứng |
|---|---|---|---|
| 3.1 | Diagnosis description (free text) | ✅ | `<textarea>` [Step3Diagnosis.tsx:59](src/components/steps/Step3Diagnosis.tsx:59) |
| 3.2 | ICD-10 autocomplete từ ≥100 mã | ✅ | **116 mã** [icd10.json](src/data/icd10.json), filter [filterIcd10.ts](src/state/filterIcd10.ts) |
| 3.3 | Treatment date: single cho outpatient/dental, range cho inpatient | ✅ | `treatmentDate` vs `admissionDate`/`dischargeDate` [Step3Diagnosis.tsx:113](src/components/steps/Step3Diagnosis.tsx:113) |
| 3.4 | Provider/hospital free text + suggestions từ mock list | ✅ | Combobox `openOnFocus`, cho nhập tự do; [providers.json](src/data/providers.json) (18 mục) |
| 3.5 | Inpatient: admission reason + length of stay auto-calc | ✅ | `admissionReason` + `lengthOfStay` (số đêm) [dates.ts:26](src/state/dates.ts:26), hiển thị live [Step3Diagnosis.tsx:136](src/components/steps/Step3Diagnosis.tsx:136) |

## Step 4 — Document Upload

| # | Yêu cầu | Trạng thái | Bằng chứng |
|---|---|---|---|
| 4.1 | Required vs optional theo claim type | ✅ | Ma trận [documentRules.ts](src/state/documentRules.ts) — outpatient/inpatient/dental đúng spec |
| 4.2 | Treatment plan required khi "major dental" | ✅ | `dentalCategory === 'major'` → required [documentRules.ts:37](src/state/documentRules.ts:37) |
| 4.3 | Validate file type PDF/JPG/PNG, ≤10MB | ✅ | [validateFile.ts](src/state/validateFile.ts) — check **cả extension lẫn MIME** |
| 4.4 | Upload progress indicator | ✅ (mô phỏng) | Progress giả lập + `role="progressbar"` [Step4Documents.tsx:144](src/components/steps/Step4Documents.tsx:144) — không backend |
| 4.5 | Chặn next nếu thiếu document bắt buộc | ✅ | [validateStep.ts:80](src/state/validateStep.ts:80) — chặn cả khi đang uploading dở |

## Step 5 — Review & Submit

| # | Yêu cầu | Trạng thái | Bằng chứng |
|---|---|---|---|
| 5.1 | Tóm tắt toàn bộ dữ liệu mọi bước | ✅ | [Step5Review.tsx](src/components/steps/Step5Review.tsx) đọc thẳng từ store |
| 5.2 | Back-navigation edit không mất dữ liệu | ✅ | `editStep` → "Save & return to review" [Step5Review.tsx:62](src/components/steps/Step5Review.tsx:62) |
| 5.3 | Checkbox "I confirm this information is accurate" | ✅ | [Step5Review.tsx:173](src/components/steps/Step5Review.tsx:173) |
| 5.4 | Submit (mock — console.log hoặc success) | ✅ | `console.log` payload qua `claimSchema.parse` + màn success [Step5Review.tsx:99](src/components/steps/Step5Review.tsx:99) |

## General

| # | Yêu cầu | Trạng thái | Bằng chứng |
|---|---|---|---|
| G.1 | Form state persist khi back/forward | ✅ | `useReducer` duy nhất tại [Wizard.tsx:14](src/components/Wizard.tsx:14) |
| G.2 | Responsive (desktop + mobile) | ✅ | Media query `@700px` / `@600px` [styles.css:201](src/styles.css:201); stepper thu gọn "Step x of 5" |
| G.3 | Keyboard accessible (tab, enter để tiếp tục) | ✅ | Mỗi step là `<form>`; combobox ↑↓ Enter Esc; focus chuyển vào heading khi đổi bước; `aria-invalid`/`role="alert"` |

## Evaluation Criteria

| Tiêu chí | Trạng thái | Ghi chú |
|---|---|---|
| 5 bước + conditional logic đúng theo type | ✅ | Test ma trận 3 type × major/non-major |
| Validation chặn submit sai | ✅ | `validateStep` + `canGoToStep` navigation guard; nút Next hiện lỗi inline |
| ICD-10 autocomplete filter 100+ codes hiệu năng tốt | ✅ | 116 mã, filter mỗi keystroke, render tối đa 20 |
| Review phản ánh đúng dữ liệu | ✅ | Đọc thẳng từ store duy nhất |
| UX mượt: progress, back/forward, no data loss | ✅ | — |
| Responsive design | ✅ | — |

---

## Quy ước tự chốt (đề không quy định)

- **"Major dental"**: thêm field *Dental treatment category* (Preventive/Basic/Major) ở Step 3.
- **Đổi claim type giữa chừng**: giữ member + diagnosis + ICD-10 + provider; reset ngày/lý do/category/documents — có `window.confirm` xác nhận trước khi reset ([Step1ClaimType.tsx:17](src/components/steps/Step1ClaimType.tsx:17)).
- **Length of stay** tính theo số đêm; cùng ngày = same-day discharge.
- **ICD-10 phải chọn từ list**; provider cho nhập tự do.
- **Upload** mô phỏng in-memory; **không** persist qua reload trang (đề chỉ yêu cầu "across steps").

## Mục cần hoàn thiện trước khi nộp

| # | Hạng mục | Trạng thái |
|---|---|---|
| S.1 | Push lên GitHub repository | ⚠️ Cần xác nhận (working dir không phải git repo) |
| S.2 | Deploy + điền Live URL vào [README.md:9](README.md:9) | ❌ README còn để trống `_(điền sau khi deploy)_` |

## Lệnh kiểm chứng

```bash
npm install
npm test      # 45/45 pass
npm run build # tsc + vite build OK
npm run dev   # http://localhost:5107
```
