import { canGoToStep, isStepValid } from '../state/validateStep';
import { STEPS } from '../state/types';
import type { StepId } from '../state/types';
import { useWizard } from './WizardContext';

export function Stepper() {
  const { state, dispatch } = useWizard();
  const { step, draft } = state;
  const current = STEPS.find((s) => s.id === step)!;

  const goTo = (target: StepId) => dispatch({ type: 'goToStep', step: target });

  return (
    <nav className="stepper-nav" aria-label="Claim submission steps">
      <ol className="stepper">
        {STEPS.map((s) => {
          const isCurrent = s.id === step;
          const isDone = s.id < step && isStepValid(s.id, draft);
          const reachable = s.id < step || canGoToStep(s.id, draft);
          return (
            <li
              key={s.id}
              className={`stepper-item${isCurrent ? ' is-current' : ''}${isDone ? ' is-done' : ''}`}
            >
              <button
                type="button"
                className="stepper-btn"
                disabled={!reachable || isCurrent}
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => goTo(s.id)}
              >
                <span className="stepper-index" aria-hidden="true">
                  {isDone ? '✓' : s.id}
                </span>
                <span className="stepper-label">{s.title}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="stepper-compact" aria-hidden="true">
        <span>
          Step {step} of {STEPS.length} — {current.title}
        </span>
        <div className="stepper-bar">
          <div className="stepper-bar-fill" style={{ width: `${(step / STEPS.length) * 100}%` }} />
        </div>
      </div>
    </nav>
  );
}
