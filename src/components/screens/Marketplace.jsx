import { useEffect, useEffectEvent } from "react";
import { TOTAL_ROUNDS } from "../../logic/sequenceGame";

const AUTO_RETURN_MS = 30000; // reset for the next visitor

function roundsPassed(history) {
  return history.filter((entry) => entry.passed).length;
}

// PLACEHOLDER layout: the real marketplace design (bidders, prices, companies) comes next.
function Marketplace({ participant, others, onFinish }) {
  const finish = useEffectEvent(() => onFinish());

  useEffect(() => {
    const timeoutId = setTimeout(finish, AUTO_RETURN_MS);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <section>
      <h1>Data Marketplace</h1>
      <p>Your data is now available to third-party partners.</p>

      {/* The current visitor's listing */}
      <div
        style={{
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          margin: "1.5rem 0",
        }}
      >
        {participant.portrait && (
          <img
            src={participant.portrait}
            alt=""
            style={{ width: 120, aspectRatio: "1", objectFit: "cover" }}
          />
        )}
        <div>
          <h2 style={{ margin: 0 }}>
            Subject #{String(participant.number).padStart(4, "0")}
          </h2>
          <p style={{ margin: 0 }}>
            Rounds completed: {roundsPassed(participant.history)} /{" "}
            {TOTAL_ROUNDS}
          </p>
        </div>
      </div>

      {/* Previous participants, newest first */}
      {others.length > 0 && (
        <>
          <h3>Other listings</h3>
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            {others.map((other) => (
              <img
                key={other.id}
                src={other.portrait}
                alt=""
                style={{ width: 80, aspectRatio: "1", objectFit: "cover" }}
              />
            ))}
          </div>
        </>
      )}

      <button type="button" onClick={onFinish} style={{ marginTop: "1.5rem" }}>
        Finish
      </button>
    </section>
  );
}

export default Marketplace;
