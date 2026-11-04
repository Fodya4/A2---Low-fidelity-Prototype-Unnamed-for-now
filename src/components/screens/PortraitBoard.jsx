// The collective board: every portrait captured this session, newest first.
// The current visitor's portrait is outlined so they can find themselves.
function PortraitBoard({ portraits, currentId, onContinue }) {
  return (
    <section>
      {/* PLACEHOLDER copy */}
      <h1>Participants</h1>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))",
          gap: "0.5rem",
          maxWidth: 900,
        }}
      >
        {portraits.map((portrait) => (
          <img
            key={portrait.id}
            src={portrait.src}
            alt=""
            style={{
              width: "100%",
              aspectRatio: "4 / 3",
              objectFit: "cover",
              outline: portrait.id === currentId ? "4px solid #ff2d55" : "none",
            }}
          />
        ))}
      </div>
      <button type="button" onClick={onContinue} style={{ marginTop: "1rem" }}>
        Continue
      </button>
    </section>
  );
}

export default PortraitBoard;
