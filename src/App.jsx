import { useCamera } from "./hooks/useCamera";
import { useBodyPose } from "./hooks/useBodyPose";
import { useMovementDetector } from "./hooks/useMovementDetector";
import { useSequenceGame } from "./hooks/useSequenceGame";
import PoseOverlay from "./components/camera/PoseOverlay";
import { MOVEMENTS } from "./logic/movements";
import { TOTAL_ROUNDS } from "./logic/sequenceGame";

const LABELS = Object.fromEntries(
  MOVEMENTS.map((movement) => [movement.id, movement.label])
);

// One row per movement in the round.
// During perform, remaining movements are hidden (that's the memory part); finished ones stay checked.
function SequenceSlots({ sequence, progress, phase, passed }) {
  return (
    <ol style={{ fontSize: "1.25rem", lineHeight: 2 }}>
      {sequence.map((id, index) => {
        let icon = "⬜";
        if (index < progress) icon = "✅";
        else if (phase === "feedback" && !passed && index === progress)
          icon = "❌";

        const revealed =
          phase === "show" || phase === "feedback" || index < progress;
        return (
          <li key={index}>
            {phase === "show" ? "" : `${icon} `}
            {revealed ? LABELS[id] : "???"}
          </li>
        );
      })}
    </ol>
  );
}

function GamePanel({ game, detector, ready }) {
  const { phase, round, sequence, progress, passed, history } = game.state;

  if (phase === "idle") {
    return (
      <button type="button" onClick={game.start} disabled={!ready}>
        {ready ? "Start game" : "Waiting for camera and model…"}
      </button>
    );
  }

  if (phase === "finished") {
    return (
      <div>
        <h2>Game complete</h2>
        <ul>
          {history.map((entry) => (
            <li key={entry.round}>
              Round {entry.round}: {entry.length} movements:{" "}
              {entry.passed ? "passed" : "failed"}
            </li>
          ))}
        </ul>
        <button type="button" onClick={game.reset}>
          Reset
        </button>
      </div>
    );
  }

  let message = "";
  if (phase === "show") message = "Memorise this sequence";
  if (phase === "perform") {
    if (!detector.inFrame) message = "Step into frame";
    else if (detector.waitingForNeutral) message = "Lower your arms";
    else message = "Do the next movement";
  }
  if (phase === "feedback")
    message = passed ? "Well done, correct sequence" : "Incorrect";

  return (
    <div>
      <h2>
        Round {round} of {TOTAL_ROUNDS}
      </h2>
      <p style={{ fontSize: "1.5rem" }}>
        <strong>{message}</strong>
      </p>
      <SequenceSlots
        sequence={sequence}
        progress={progress}
        phase={phase}
        passed={passed}
      />
    </div>
  );
}

function App() {
  const { videoRef, status: cameraStatus, error: cameraError } = useCamera();
  const {
    posesRef,
    connections,
    status: poseStatus,
    error: poseError,
  } = useBodyPose(videoRef, { enabled: cameraStatus === "ready" });
  const game = useSequenceGame();
  const detector = useMovementDetector(posesRef, {
    enabled: game.state.phase === "perform",
    onMovement: game.reportMovement,
  });

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>A2 Prototype: sequence game</h1>
      {cameraError && <p style={{ color: "crimson" }}>{cameraError}</p>}
      {poseError && <p style={{ color: "crimson" }}>{poseError}</p>}

      <div
        style={{
          display: "flex",
          gap: "2rem",
          alignItems: "flex-start",
          flexWrap: "wrap",
        }}
      >
        <div style={{ position: "relative", width: 640, maxWidth: "100%" }}>
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              display: "block",
              width: "100%",
              height: "auto",
              transform: "scaleX(-1)",
              background: "#111",
            }}
          />
          <PoseOverlay
            videoRef={videoRef}
            posesRef={posesRef}
            connections={connections}
          />
        </div>

        <GamePanel
          game={game}
          detector={detector}
          ready={poseStatus === "detecting"}
        />
      </div>
    </main>
  );
}

export default App;
