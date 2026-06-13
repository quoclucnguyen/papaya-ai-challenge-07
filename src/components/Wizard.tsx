import { useEffect, useMemo, useReducer, useRef } from 'react';
import memberData from '../data/member.json';
import { createInitialState, wizardReducer } from '../state/wizardReducer';
import { Step1ClaimType } from './steps/Step1ClaimType';
import { Step2Member } from './steps/Step2Member';
import { Step3Diagnosis } from './steps/Step3Diagnosis';
import { Step4Documents } from './steps/Step4Documents';
import { Step5Review } from './steps/Step5Review';
import { Stepper } from './Stepper';
import { SuccessScreen } from './SuccessScreen';
import { WizardContext } from './WizardContext';

export function Wizard() {
  const [state, dispatch] = useReducer(wizardReducer, memberData.member, createInitialState);
  const ctx = useMemo(() => ({ state, dispatch }), [state]);

  // Move focus to the new step's heading after navigation (skipped on the
  // initial page load so we don't steal focus from the document).
  const firstRenderRef = useRef(true);
  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return;
    }
    document.querySelector<HTMLElement>('.step-title')?.focus();
  }, [state.step]);

  return (
    <WizardContext.Provider value={ctx}>
      {state.submitted ? (
        <div className="panel">
          <SuccessScreen />
        </div>
      ) : (
        <>
          <Stepper />
          <div className="panel">
            {state.step === 1 && <Step1ClaimType />}
            {state.step === 2 && <Step2Member />}
            {state.step === 3 && <Step3Diagnosis />}
            {state.step === 4 && <Step4Documents />}
            {state.step === 5 && <Step5Review />}
          </div>
        </>
      )}
    </WizardContext.Provider>
  );
}
