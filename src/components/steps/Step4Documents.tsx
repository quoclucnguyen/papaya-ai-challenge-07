import { useEffect, useRef, useState } from 'react';
import type { DragEvent } from 'react';
import { documentRules } from '../../state/documentRules';
import type { DocumentRequirement } from '../../state/documentRules';
import { formatFileSize, validateFile } from '../../state/validateFile';
import type { DocumentSlotState, DocumentTypeId } from '../../state/types';
import type { WizardAction } from '../../state/wizardReducer';
import { StepShell } from '../StepShell';
import { useStepForm } from '../useStepForm';

export function Step4Documents() {
  const { draft, dispatch, errors, handleSubmit } = useStepForm(4);
  if (!draft.claimType) return null; // unreachable: navigation guard requires step 1

  const rules = documentRules(draft.claimType, draft.diagnosis.dentalCategory);

  return (
    <StepShell
      title="Upload documents"
      description="PDF, JPG or PNG, up to 10MB per file. Required documents must finish uploading before you can continue."
      onSubmit={handleSubmit}
    >
      <ul className="doc-list">
        {rules.map((rule) => (
          <DocumentSlot
            key={rule.id}
            rule={rule}
            slot={draft.documents[rule.id]}
            error={errors[`doc_${rule.id}`]}
            dispatch={dispatch}
          />
        ))}
      </ul>
    </StepShell>
  );
}

interface DocumentSlotProps {
  rule: DocumentRequirement;
  slot?: DocumentSlotState;
  error?: string;
  dispatch: (action: WizardAction) => void;
}

function DocumentSlot({ rule, slot, error, dispatch }: DocumentSlotProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const doc: DocumentTypeId = rule.id;

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearInterval(timerRef.current);
    },
    [],
  );

  const handleFile = (file: File) => {
    const check = validateFile(file.name, file.size, file.type);
    if (!check.ok) {
      dispatch({ type: 'uploadError', doc, fileName: file.name, error: check.error });
      return;
    }
    dispatch({ type: 'uploadStart', doc, fileName: file.name, fileSize: file.size });
    // No backend — simulate a short upload so the progress UI is observable.
    let progress = 0;
    timerRef.current = window.setInterval(() => {
      progress += 12 + Math.random() * 18;
      if (progress >= 100) {
        window.clearInterval(timerRef.current!);
        timerRef.current = null;
        dispatch({ type: 'uploadDone', doc });
      } else {
        dispatch({ type: 'uploadProgress', doc, progress: Math.round(progress) });
      }
    }, 160);
  };

  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const inputId = `doc-${doc}`;
  const status = slot?.status;

  return (
    <li
      className={`doc-slot${dragOver ? ' is-dragover' : ''}${error ? ' has-error' : ''}${status === 'done' ? ' is-done' : ''}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <div className="doc-slot-header">
        <span className="doc-slot-title">
          {rule.label}
          {rule.required && (
            <span className="required-mark" aria-hidden="true">
              *
            </span>
          )}
          {rule.required && <span className="sr-only"> required</span>}
        </span>
        <span className={`badge ${rule.required ? 'badge-required' : 'badge-optional'}`}>
          {rule.required ? 'Required' : 'Optional'}
        </span>
      </div>
      {rule.hint && <p className="doc-slot-hint">{rule.hint}</p>}

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className="sr-only"
        accept=".pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png"
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${inputId}-error` : undefined}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
          e.target.value = ''; // allow re-selecting the same file
        }}
      />

      {(!slot || status === 'error') && (
        <div className="doc-dropzone">
          {status === 'error' && (
            <p className="doc-file-error" role="alert">
              {slot!.fileName}: {slot!.error}
            </p>
          )}
          <button type="button" className="btn btn-secondary" onClick={() => inputRef.current?.click()}>
            Choose file
          </button>
          <span className="doc-dropzone-hint">or drag &amp; drop here</span>
        </div>
      )}

      {status === 'uploading' && (
        <div className="doc-progress">
          <span className="doc-file-name">{slot!.fileName}</span>
          <div
            className="progress-track"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={slot!.progress}
            aria-label={`Uploading ${slot!.fileName}`}
          >
            <div className="progress-fill" style={{ width: `${slot!.progress}%` }} />
          </div>
          <span className="doc-progress-pct">{slot!.progress}%</span>
        </div>
      )}

      {status === 'done' && (
        <div className="doc-done">
          <span className="doc-done-check" aria-hidden="true">
            ✓
          </span>
          <span className="doc-file-name">
            {slot!.fileName} <span className="doc-file-size">({formatFileSize(slot!.fileSize)})</span>
          </span>
          <span className="doc-done-actions">
            <button type="button" className="btn btn-link" onClick={() => inputRef.current?.click()}>
              Replace
            </button>
            <button
              type="button"
              className="btn btn-link btn-danger"
              onClick={() => dispatch({ type: 'removeDocument', doc })}
            >
              Remove
            </button>
          </span>
        </div>
      )}

      {error && (
        <p className="field-error" id={`${inputId}-error`} role="alert">
          {error}
        </p>
      )}
    </li>
  );
}
