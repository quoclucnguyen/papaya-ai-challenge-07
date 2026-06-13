import { useMemo, useState } from 'react';
import icd10 from '../../data/icd10.json';
import providers from '../../data/providers.json';
import { lengthOfStay, toIsoDate } from '../../state/dates';
import { filterIcd10 } from '../../state/filterIcd10';
import { DENTAL_CATEGORY_LABELS } from '../../state/types';
import type { DentalCategory, DiagnosisInfo } from '../../state/types';
import { Combobox } from '../fields/Combobox';
import { FormField, StepShell, fieldAria } from '../StepShell';
import { useStepForm } from '../useStepForm';

function icdLabel(code: string): string {
  const entry = icd10.find((e) => e.code === code);
  return entry ? `${entry.code} — ${entry.description}` : code;
}

export function Step3Diagnosis() {
  const { draft, dispatch, errors, handleSubmit } = useStepForm(3);
  const d = draft.diagnosis;
  const today = toIsoDate(new Date());

  const set = (field: keyof DiagnosisInfo, value: string) =>
    dispatch({ type: 'setDiagnosisField', field, value });

  // The combobox input shows free text until a code is picked from the list;
  // only a picked code is stored in the draft (validated as required).
  const [icdText, setIcdText] = useState(() => (d.icd10Code ? icdLabel(d.icd10Code) : ''));
  const icdOptions = useMemo(
    () =>
      filterIcd10(icd10, icdText).map((e) => ({
        id: e.code,
        primary: e.code,
        secondary: e.description,
      })),
    [icdText],
  );

  const providerOptions = useMemo(() => {
    const q = d.providerName.trim().toLowerCase();
    const list = q ? providers.filter((p) => p.toLowerCase().includes(q)) : providers;
    return list.slice(0, 8).map((p) => ({ id: p, primary: p }));
  }, [d.providerName]);

  const nights =
    draft.claimType === 'inpatient' ? lengthOfStay(d.admissionDate, d.dischargeDate) : null;

  return (
    <StepShell
      title="Diagnosis & treatment"
      description="Tell us what was diagnosed and where you were treated."
      onSubmit={handleSubmit}
    >
      <FormField
        id="diagnosisDescription"
        label="Diagnosis description"
        error={errors.diagnosisDescription}
        required
      >
        <textarea
          rows={3}
          value={d.diagnosisDescription}
          onChange={(e) => set('diagnosisDescription', e.target.value)}
          placeholder="Describe the symptoms and diagnosis…"
          {...fieldAria('diagnosisDescription', errors.diagnosisDescription)}
        />
      </FormField>

      <FormField
        id="icd10Code"
        label="ICD-10 code"
        error={errors.icd10Code}
        hint="Type a code or a condition name and pick from the list (e.g. “E11” or “diabetes”)"
        required
      >
        <Combobox
          id="icd10Code"
          value={icdText}
          options={icdOptions}
          placeholder="Search ICD-10 codes…"
          error={errors.icd10Code}
          hint="yes"
          onInputChange={(text) => {
            setIcdText(text);
            if (d.icd10Code) set('icd10Code', '');
          }}
          onSelect={(option) => {
            set('icd10Code', option.id);
            setIcdText(`${option.primary} — ${option.secondary ?? ''}`);
          }}
        />
      </FormField>

      <FormField
        id="providerName"
        label="Provider / hospital name"
        error={errors.providerName}
        hint="Pick a suggestion or type any provider name"
        required
      >
        <Combobox
          id="providerName"
          value={d.providerName}
          options={providerOptions}
          placeholder="e.g. FV Hospital"
          openOnFocus
          error={errors.providerName}
          hint="yes"
          onInputChange={(text) => set('providerName', text)}
          onSelect={(option) => set('providerName', option.id)}
        />
      </FormField>

      {draft.claimType === 'inpatient' ? (
        <>
          <div className="field-grid">
            <FormField id="admissionDate" label="Admission date" error={errors.admissionDate} required>
              <input
                type="date"
                max={today}
                value={d.admissionDate}
                onChange={(e) => set('admissionDate', e.target.value)}
                {...fieldAria('admissionDate', errors.admissionDate)}
              />
            </FormField>
            <FormField id="dischargeDate" label="Discharge date" error={errors.dischargeDate} required>
              <input
                type="date"
                min={d.admissionDate || undefined}
                max={today}
                value={d.dischargeDate}
                onChange={(e) => set('dischargeDate', e.target.value)}
                {...fieldAria('dischargeDate', errors.dischargeDate)}
              />
            </FormField>
          </div>
          {nights !== null && (
            <p className="los-note" role="status">
              Length of stay:{' '}
              <strong>{nights === 0 ? 'same-day discharge (0 nights)' : `${nights} night${nights > 1 ? 's' : ''}`}</strong>{' '}
              (calculated automatically)
            </p>
          )}
          <FormField id="admissionReason" label="Admission reason" error={errors.admissionReason} required>
            <textarea
              rows={2}
              value={d.admissionReason}
              onChange={(e) => set('admissionReason', e.target.value)}
              placeholder="Why was hospital admission required?"
              {...fieldAria('admissionReason', errors.admissionReason)}
            />
          </FormField>
        </>
      ) : (
        <FormField id="treatmentDate" label="Treatment date" error={errors.treatmentDate} required>
          <input
            type="date"
            max={today}
            value={d.treatmentDate}
            onChange={(e) => set('treatmentDate', e.target.value)}
            {...fieldAria('treatmentDate', errors.treatmentDate)}
          />
        </FormField>
      )}

      {draft.claimType === 'dental' && (
        <FormField
          id="dentalCategory"
          label="Dental treatment category"
          error={errors.dentalCategory}
          hint={
            d.dentalCategory === 'major'
              ? 'A treatment plan will be required in the documents step.'
              : 'Major treatment (crown, implant, orthodontics) requires a treatment plan.'
          }
          required
        >
          <select
            value={d.dentalCategory}
            onChange={(e) => set('dentalCategory', e.target.value)}
            {...fieldAria('dentalCategory', errors.dentalCategory, 'hint')}
          >
            <option value="">Select a category…</option>
            {(Object.keys(DENTAL_CATEGORY_LABELS) as DentalCategory[]).map((cat) => (
              <option key={cat} value={cat}>
                {DENTAL_CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>
        </FormField>
      )}
    </StepShell>
  );
}
