import { useEffect, useEffectEvent, useState } from "react";
import ProgressBar from "../shared/ProgressBar";

// PLACEHOLDER copy: each line shows for STEP_MS; the last one holds longer.
const STEPS = [
  "Analyzing movement data…",
  "Generating your image…",
  "Compiling participant profile…",
  "Information saved, analyzed, and transferred.",
];
const STEP_MS = 1800;
const FINAL_HOLD_MS = 2500;

// Fake processing screen between the game and the marketplace.
function AnalyzingScreen({ onDone }) {
  const [step, setStep] = useState(0);
  const finish = useEffectEvent(() => onDone());
  const isLastStep = step === STEPS.length - 1;

  useEffect(() => {
    const timeoutId = setTimeout(
      () => (isLastStep ? finish() : setStep((value) => value + 1)),
      isLastStep ? FINAL_HOLD_MS : STEP_MS
    );
    return () => clearTimeout(timeoutId);
  }, [step, isLastStep]);

  return (
    <section style={{ maxWidth: 520, paddingTop: "15vh" }}>
      <ProgressBar value={step / (STEPS.length - 1)} label="Progress" />
      <h2>{STEPS[step]}</h2>
    </section>
  );
}

export default AnalyzingScreen;
