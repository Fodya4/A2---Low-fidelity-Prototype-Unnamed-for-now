import { useEffect, useEffectEvent, useRef } from "react";
import { useCamera } from "../../hooks/useCamera";
import { useBodyPose } from "../../hooks/useBodyPose";
import { useMovementDetector } from "../../hooks/useMovementDetector";
import { useSequenceGame } from "../../hooks/useSequenceGame";
import PoseOverlay from "../camera/PoseOverlay";
import ProgressBar from "../shared/ProgressBar";
import { MOVEMENTS } from "../../logic/movements";
import { TOTAL_ROUNDS, gameProgress } from "../../logic/sequenceGame";
import { capturePortrait } from "../../lib/capturePortrait";

const LABELS = Object.fromEntries(
  MOVEMENTS.map((movement) => [movement.id, movement.label])
);
const FINISH_DELAY_MS = 2500; // pause on "processing" before handing off to the reveal

// Shown before the game starts. Explains the mechanics only, never the portrait.
function Instructions({ ready, onStart }) {
  return (
    <div style={{ maxWidth: 420 }}>
      {/* PLACEHOLDER copy: the group can rewrite this. */}
      <h2>How it works</h2>
      <ol style={{ lineHeight: 1.7, paddingLeft: "1.25rem" }}>
        <li>Stand so your head, shoulders and arms are visible on screen.</li>
        <li>
          Each round, a sequence of movements appears. Memorise it before it
          disappears.
        </li>
        <li>Perform the movements in order, from memory.</li>
        <li>
          Hold each movement for a moment, then lower your arms before the next
          one.
        </li>
        <li>
          There are {TOTAL_ROUNDS} rounds. Get every movement in a round right,
          and the next round adds one more.
        </li>
      </ol>

      <p style={{ marginBottom: "0.25rem" }}>
        <strong>The movements:</strong>
      </p>
      <ul style={{ lineHeight: 1.7, paddingLeft: "1.25rem", marginTop: 0 }}>
        {MOVEMENTS.map((movement) => (
          <li key={movement.id}>{movement.label}</li>
        ))}
      </ul>

      <button type="button" onClick={onStart} disabled={!ready}>
        {ready ? "Start" : "Waiting for camera and model…"}
      </button>
    </div>
  );
}

// One row per movement. Attempted movements show ✅ or ❌ and stay marked;
// movements not yet attempted stay hidden during perform (the memory part).
function SequenceSlots({ sequence, results, phase }) {
  return (
    <ol style={{ fontSize: "1.25rem", lineHeight: 2 }}>
      {sequence.map((id, index) => {
        const attempted = index < results.length;
        let icon = "⬜";
        if (attempted) icon = results[index] ? "✅" : "❌";

        const revealed = phase === "show" || phase === "feedback" || attempted;
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

function GamePanel({ state, detector, ready, onStart }) {
  const { phase, round, sequence, results, passed } = state;

  if (phase === "idle") {
    return <Instructions ready={ready} onStart={onStart} />;
  }

  const progressBar = (
    <ProgressBar value={gameProgress(state)} label="Building your result" />
  );

  if (phase === "finished") {
    return (
      <div>
        {progressBar}
        <h2>Processing your results…</h2>
      </div>
    );
  }

  let message = "";
  if (phase === "show") message = "Memorise this sequence";
  if (phase === "perform") {
    const lastResult = results.at(-1); // undefined before the first attempt
    if (!detector.inFrame) {
      message = "Step into frame";
    } else if (detector.waitingForNeutral) {
      // Immediate feedback on the movement just attempted, combined with the next instruction.
      if (lastResult === undefined) message = "Lower your arms";
      else
        message = lastResult
          ? "Correct. Lower your arms"
          : "Incorrect. Lower your arms";
    } else {
      message = "Do the next movement";
    }
  }
  if (phase === "feedback") {
    const correctCount = results.filter(Boolean).length;
    message = passed
      ? "Well done, correct sequence"
      : `Incorrect sequence: ${correctCount} of ${sequence.length} correct`;
  }

  return (
    <div>
      {progressBar}
      <h2>
        Round {round} of {TOTAL_ROUNDS}
      </h2>
      <p style={{ fontSize: "1.5rem" }}>
        <strong>{message}</strong>
      </p>
      <SequenceSlots sequence={sequence} results={results} phase={phase} />
    </div>
  );
}

function MovementGame({ onComplete }) {
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

  // Holds the portrait until the game ends. A ref, because the screen never displays it.
  const portraitRef = useRef(null);

  function handleStart() {
    portraitRef.current = capturePortrait(videoRef.current);
    game.start();
  }

  // When the game finishes, wait briefly, then hand the portrait to App.
  const finish = useEffectEvent(() => onComplete(portraitRef.current));
  const finished = game.state.phase === "finished";

  useEffect(() => {
    if (!finished) return;
    const timeoutId = setTimeout(finish, FINISH_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [finished]);

  return (
    <section>
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
          state={game.state}
          detector={detector}
          ready={poseStatus === "detecting"}
          onStart={handleStart}
        />
      </div>
    </section>
  );
}

export default MovementGame;
