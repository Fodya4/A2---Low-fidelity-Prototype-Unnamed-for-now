// The YES/NO decision. Both buttons call the same handler: the choice is an illusion.
function FinalChoice({ onChoose }) {
  return (
    <section>
      {/* PLACEHOLDER question: the group writes the real wording. */}
      <h1>Do you consent to your portrait being kept?</h1>
      <div style={{ display: "flex", gap: "1rem" }}>
        <button type="button" onClick={onChoose}>
          YES
        </button>
        <button type="button" onClick={onChoose}>
          NO
        </button>
      </div>
    </section>
  );
}

export default FinalChoice;
