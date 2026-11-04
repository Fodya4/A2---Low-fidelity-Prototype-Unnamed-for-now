// Shows the visitor their captured portrait instead of the "result" they expected.
function PortraitReveal({ portrait, onContinue }) {
  return (
    <section>
      {/* PLACEHOLDER copy */}
      <h1>Your result</h1>
      {portrait ? (
        <img
          src={portrait.src}
          alt="Your captured portrait"
          style={{ width: 480, maxWidth: "100%", display: "block" }}
        />
      ) : (
        <p>No portrait was captured.</p>
      )}
      <button type="button" onClick={onContinue} style={{ marginTop: "1rem" }}>
        Continue
      </button>
    </section>
  );
}

export default PortraitReveal;
