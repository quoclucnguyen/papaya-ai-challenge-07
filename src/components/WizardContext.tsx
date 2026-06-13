import { createContext, useContext } from 'react';
import type { Dispatch } from 'react';
import type { WizardState } from '../state/types';
import type { WizardAction } from '../state/wizardReducer';

export interface WizardContextValue {
  state: WizardState;
  dispatch: Dispatch<WizardAction>;
}

export const WizardContext = createContext<WizardContextValue | null>(null);

export function useWizard(): WizardContextValue {
  const ctx = useContext(WizardContext);
  if (!ctx) throw new Error('useWizard must be used inside <Wizard>');
  return ctx;
}
