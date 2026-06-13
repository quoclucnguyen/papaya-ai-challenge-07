import { Wizard } from './components/Wizard';

export default function App() {
  return (
    <div className="app">
      <header className="app-header">
        <span className="app-brand" aria-hidden="true">
          🧾
        </span>
        <div>
          <h1>Claim submission</h1>
          <p className="app-subtitle">
            Submit an outpatient, inpatient or dental claim in five short steps.
          </p>
        </div>
      </header>
      <main>
        <Wizard />
      </main>
      <footer className="app-footer">
        AI Challenge 07 — Claims Intake Wizard · mock data, no real submission
      </footer>
    </div>
  );
}
