import { useEffect, useEffectEvent, useState } from "react";
import ProgressBar from "../shared/ProgressBar";
import "./AnalyzingScreen.css";

// The bar jumps between these values. Uneven gaps (fast, stall, jump) feel like real processing.
const CHECKPOINTS = [0, 0.12, 0.31, 0.38, 0.57, 0.74, 0.86, 0.97, 1];
const STEP_MS = 900; // time between checkpoints
const DONE_HOLD_MS = 2800; // how long the final message stays before the marketplace

// Screen 6: fake "generating" screen that turns out to be a data transfer.
function AnalyzingScreen({ onDone }) {
  const [step, setStep] = useState(0);
  const finish = useEffectEvent(() => onDone());
  const done = step === CHECKPOINTS.length - 1;

  useEffect(() => {
    const timeoutId = setTimeout(
      () => (done ? finish() : setStep((value) => value + 1)),
      done ? DONE_HOLD_MS : STEP_MS
    );
    return () => clearTimeout(timeoutId);
  }, [step, done]);

  return (
    <section className="screen analyzing">
      <h1 className="screen-title analyzing__title" aria-live="polite">
        {done
          ? "Information saved, analyzed, and transferred."
          : "Generating Your AI Image..."}
      </h1>
      <ProgressBar value={CHECKPOINTS[step]} label="Generating" />
    </section>
  );
}

export default AnalyzingScreen;
