import { z } from 'zod';

const requiredString = (message: string) => z.string().trim().min(1, message);
const isoDate = (message: string) =>
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/, message);

/** Step 2 — member & policy shape (cross-field rules live in validateStep). */
export const memberSchema = z.object({
  memberName: requiredString('Member name is required'),
  policyNumber: requiredString('Policy number is required'),
  memberId: requiredString('Member ID is required'),
  dateOfBirth: isoDate('Enter a valid date of birth'),
});

/** Step 3 — fields shared by every claim type. */
export const diagnosisBaseSchema = z.object({
  diagnosisDescription: requiredString('Describe the diagnosis'),
  icd10Code: requiredString('Select an ICD-10 code from the list'),
  providerName: requiredString('Provider or hospital name is required'),
});

const singleDateClaim = z.object({
  treatmentDate: isoDate('Treatment date is required'),
});

export const outpatientSchema = diagnosisBaseSchema.extend(singleDateClaim.shape).extend({
  claimType: z.literal('outpatient'),
});

export const dentalSchema = diagnosisBaseSchema.extend(singleDateClaim.shape).extend({
  claimType: z.literal('dental'),
  dentalCategory: z.enum(['preventive', 'basic', 'major']),
});

export const inpatientSchema = diagnosisBaseSchema.extend({
  claimType: z.literal('inpatient'),
  admissionDate: isoDate('Admission date is required'),
  dischargeDate: isoDate('Discharge date is required'),
  admissionReason: requiredString('Admission reason is required'),
});

/**
 * Full claim payload — used as a final assertion when building the mock
 * submission. Per-step UI validation goes through validateStep, which
 * layers cross-field rules (future dates, date ordering, documents) on top.
 */
export const claimSchema = z.discriminatedUnion('claimType', [
  outpatientSchema.extend(memberSchema.shape),
  inpatientSchema.extend(memberSchema.shape),
  dentalSchema.extend(memberSchema.shape),
]);

export type ClaimPayload = z.infer<typeof claimSchema>;
