// A simple horizontal progress bar. value is between 0 and 1.
function ProgressBar({ value, label }) {
  const percent = Math.round(Math.max(0, Math.min(1, value)) * 100);

  return (
    <div style={{ width: 360, maxWidth: "100%", marginBottom: "1rem" }}>
      {label && (
        <p style={{ margin: "0 0 0.35rem", fontSize: "0.9rem" }}>
          {label}: {percent}%
        </p>
      )}
      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        style={{
          height: 12,
          background: "#333",
          borderRadius: 6,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            background: "#00ff88",
            transition: "width 0.6s ease", // smooth fill instead of jumping
          }}
        />
      </div>
    </div>
  );
}

export default ProgressBar;
