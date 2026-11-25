import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useCamera } from "../../hooks/useCamera";
import { useBodyPose } from "../../hooks/useBodyPose";
import { useMovementDetector } from "../../hooks/useMovementDetector";
import { useSequenceGame, TIMING } from "../../hooks/useSequenceGame";
import { useFaceInFrame } from "../../hooks/useFaceInFrame";
import PoseOverlay from "../camera/PoseOverlay";
import ProgressBar from "../shared/ProgressBar";
import { MOVEMENTS } from "../../logic/movements";
import { TOTAL_ROUNDS, gameProgress } from "../../logic/sequenceGame";
import { capturePortrait } from "../../lib/capturePortrait";

const LABELS = Object.fromEntries(
  MOVEMENTS.map((movement) => [movement.id, movement.label])
);
const FINISH_DELAY_MS = 2500; // pause on "processing" before handing off to the next screen

// The instructions screen (the game's idle phase). Start stays disabled
// until the camera and model are ready AND a face is clearly in frame.
function Instructions({ ready, faceReady, onStart }) {
  let buttonLabel = "Start";
  if (!ready) buttonLabel = "Waiting for camera and model…";
  else if (!faceReady) buttonLabel = "Position your face in the frame to begin";

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
        <li>
          After the countdown, perform the movements in order, from memory.
        </li>
        <li>
          Hold each movement for a moment until it registers, then go to the
          next one.
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

      <button type="button" onClick={onStart} disabled={!ready || !faceReady}>
        {buttonLabel}
      </button>
    </div>
  );
}

// Counts down from TIMING.countdownFrom to "Go!", one number per second.
// Only mounted during the countdown phase, so it starts fresh every round.
function Countdown() {
  const [count, setCount] = useState(TIMING.countdownFrom);

  useEffect(() => {
    if (count <= 0) return;
    const timeoutId = setTimeout(() => setCount((value) => value - 1), 1000);
    return () => clearTimeout(timeoutId);
  }, [count]);

  return (
    <p style={{ fontSize: "4rem", fontWeight: 700, margin: "0.5rem 0" }}>
      {count > 0 ? count : "Go!"}
    </p>
  );
}

// One row per movement. Attempted movements show ✅ or ❌ and stay marked;
// movements not yet attempted stay hidden (the memory part).
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

function GamePanel({ state, detector, ready, faceReady, onStart }) {
  const { phase, round, sequence, results, passed } = state;

  if (phase === "idle") {
    return (
      <Instructions ready={ready} faceReady={faceReady} onStart={onStart} />
    );
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
  if (phase === "show")
    message = "Memorise these movements. You'll repeat them in order.";
  if (phase === "countdown") message = "Get ready…";
  if (phase === "perform") {
    const lastResult = results.at(-1); // undefined before the first attempt
    const nextNumber = results.length + 1;
    if (!detector.inFrame) {
      message = "Step into frame";
    } else if (lastResult === undefined) {
      message = "Do movement 1";
    } else {
      // Immediate feedback on the last movement, plus which movement comes next.
      message = `${
        lastResult ? "Correct" : "Incorrect"
      }. Now do movement ${nextNumber}`;
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
      {phase === "countdown" && <Countdown />}
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

  const ready = poseStatus === "detecting";
  // Face check only runs on the instructions screen, before the game starts.
  const faceReady = useFaceInFrame(posesRef, {
    enabled: ready && game.state.phase === "idle",
  });

  // Holds the portrait until the game ends. A ref, because the screen never displays it.
  const portraitRef = useRef(null);

  function handleStart() {
    if (!faceReady) return; // safety: never capture without a face in frame
    portraitRef.current = capturePortrait(videoRef.current);
    game.start();
  }

  // When the game finishes, wait briefly, then hand the portrait and results to App.
  const finish = useEffectEvent(() => {
    onComplete({ portrait: portraitRef.current, history: game.state.history });
  });
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
          ready={ready}
          faceReady={faceReady}
          onStart={handleStart}
        />
      </div>
    </section>
  );
}

export default MovementGame;
