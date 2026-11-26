import "./ProgressBar.css";

// A pill-shaped progress bar. value is between 0 and 1.
// label is read by screen readers only (the design shows no visible label).
function ProgressBar({ value, label }) {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);

  return (
    <div
      className="progress"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div className="progress__fill" style={{ width: `${percent}%` }} />
    </div>
  );
}

export default ProgressBar;
