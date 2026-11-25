// PLACEHOLDER: replace with the installation's real name.
const GAME_TITLE = "UNTITLED";

// The landing screen: gives the experience a "game" feel before the consent form.
function StartScreen({ onBegin }) {
  return (
    <section style={{ textAlign: "center", paddingTop: "15vh" }}>
      <h1 style={{ fontSize: "4rem", marginBottom: "1rem" }}>{GAME_TITLE}</h1>
      {/* PLACEHOLDER tagline */}
      <p style={{ fontSize: "1.25rem", marginBottom: "2rem" }}>
        A movement memory game
      </p>
      <button
        type="button"
        onClick={onBegin}
        style={{ fontSize: "1.25rem", padding: "0.75rem 2rem" }}
      >
        Begin
      </button>
    </section>
  );
}

export default StartScreen;
