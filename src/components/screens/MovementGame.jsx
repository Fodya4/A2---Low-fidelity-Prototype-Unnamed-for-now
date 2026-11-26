import { useEffect, useEffectEvent, useRef, useState } from "react";
import { useCamera } from "../../hooks/useCamera";
import { useBodyPose } from "../../hooks/useBodyPose";
import { useMovementDetector } from "../../hooks/useMovementDetector";
import { useSequenceGame, TIMING } from "../../hooks/useSequenceGame";
import { useFaceInFrame } from "../../hooks/useFaceInFrame";
import PoseOverlay from "../camera/PoseOverlay";
import { MOVEMENTS } from "../../logic/movements";
import { TOTAL_ROUNDS } from "../../logic/sequenceGame";
import { capturePortrait } from "../../lib/capturePortrait";
// Diagrams are imported (not referenced by path) so Vite adds the right base path for GitHub Pages.
import rightArmUp from "../../assets/movements/right-arm-up.png";
import leftArmUp from "../../assets/movements/left-arm-up.png";
import bothArmsUp from "../../assets/movements/both-arms-up.png";
import armsToTheSide from "../../assets/movements/arms-to-the-side.png";
import handsOnHead from "../../assets/movements/hands-on-head.png";
import "./MovementGame.css";

const LABELS = Object.fromEntries(
  MOVEMENTS.map((movement) => [movement.id, movement.label])
);

// Which diagram goes with which movement id.
const DIAGRAMS = {
  raiseRightHand: rightArmUp,
  raiseLeftHand: leftArmUp,
  bothHandsUp: bothArmsUp,
  tPose: armsToTheSide,
  handsOnHead: handsOnHead,
};

const TITLES = {
  instructions: "Instructions",
  memorise: "Please Remember the Following Sequence:",
  perform: "Now do the Movement Sequence:",
};

const MOVE_SECONDS = Math.round(TIMING.moveTimeoutMs / 1000); // per-movement countdown
const FINISH_DELAY_MS = 2500; // pause on "processing" before handing off to the next screen
const SNAPSHOT_MAX_WIDTH = 360; // in-game snapshots are smaller than the thumbnail

// Which screen layout each game phase uses.
function layoutFor(phase) {
  if (phase === "idle") return "instructions"; // Screen 3
  if (phase === "show") return "memorise"; // Screen 4
  return "perform"; // Screen 5 (countdown, perform, feedback, finished)
}

// Screen 3 text, from the group's Figma (steps 3 and 4 reworded: no reset needed).
function InstructionsPanel() {
  return (
    <div className="panel game__instructions">
      <p>
        Welcome to Complete the Sequence, an interactive movement-based game
        where your movements generate a personalized image.
      </p>
      <ol>
        <li>
          Stand in front of the camera and make sure your upper body is fully
          visible.
        </li>
        <li>Follow the movement instructions displayed on the screen.</li>
        <li>
          Hold each position for a moment to give the system time to register
          your movement.
        </li>
        <li>
          Once your movement is recognized, move straight on to the next one.
        </li>
        <li>
          Complete all the movement challenges to generate and reveal your
          personalized image.
        </li>
      </ol>
      <p>Pay close attention to the instructions and complete the sequence!</p>
    </div>
  );
}

// Screen 4: the round's movements as numbered diagram cards.
function MemorisePanel({ sequence }) {
  return (
    <div className="panel game__memorise">
      <ol className="game__diagrams">
        {sequence.map((id, index) => (
          <li key={index} className="game__diagram">
            <span className="game__diagram-number">{index + 1}</span>
            <img
              src={DIAGRAMS[id]}
              alt={LABELS[id]}
              className="game__diagram-image"
            />
          </li>
        ))}
      </ol>
    </div>
  );
}

// Counts down whole seconds from `from`, then shows endLabel.
// Given a new `key` each time it should restart, so it always starts fresh.
function SecondsCountdown({ from, endLabel }) {
  const [count, setCount] = useState(from);

  useEffect(() => {
    if (count <= 0) return;
    const timeoutId = setTimeout(() => setCount((value) => value - 1), 1000);
    return () => clearTimeout(timeoutId);
  }, [count]);

  return count > 0 ? count : endLabel;
}

// Screen 5's right-hand side: what to do, the big number, and the latest result.
function PerformPanel({ state, inFrame }) {
  const { phase, round, progress, sequence, results, passed } = state;

  let label = "";
  let big = null;
  let status = "";

  if (phase === "countdown") {
    label = "Get ready";
    big = (
      <SecondsCountdown
        key={`countdown-${round}`}
        from={TIMING.countdownFrom}
        endLabel="Go!"
      />
    );
  }

  if (phase === "perform") {
    const current = results.length + 1;
    const lastResult = results.at(-1); // undefined before the first attempt
    label = `Do Movement ${current}`;
    // New key per movement, so the 8-second countdown restarts after every attempt.
    big = (
      <SecondsCountdown
        key={`move-${round}-${progress}`}
        from={MOVE_SECONDS}
        endLabel="0"
      />
    );
    if (!inFrame) status = "Step into frame";
    else if (lastResult !== undefined) {
      status = `Movement ${current - 1}: ${
        lastResult ? "Correct" : "Incorrect"
      }`;
    }
  }

  if (phase === "feedback") {
    const correctCount = results.filter(Boolean).length;
    label = `Round ${round} complete`;
    big = `${correctCount}/${sequence.length}`;
    status = passed ? "Well done, correct sequence" : "Incorrect sequence";
  }

  if (phase === "finished") {
    label = "Sequence complete";
    status = "Processing your results…";
  }

  return (
    <div className="game__perform">
      <p className="game__round">
        Round {round} of {TOTAL_ROUNDS}
      </p>
      <p className="game__perform-label">{label}</p>
      <p className="game__big-number countdown-number">{big}</p>
      {/* aria-live: screen readers announce results as they appear */}
      <p className="game__status" aria-live="polite">
        {status}
      </p>
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
  const { phase, round, sequence, results } = game.state;

  const ready = poseStatus === "detecting";
  // Face check only runs on the instructions screen, before the game starts.
  const faceReady = useFaceInFrame(posesRef, {
    enabled: ready && phase === "idle",
  });

  // Photos are held in refs: the game screen never displays them.
  const portraitRef = useRef(null); // the thumbnail, taken at Start
  const snapshotsRef = useRef([]); // one sneaky photo per round
  const capturePlanRef = useRef(null); // which movement triggers this round's photo

  // At the start of each perform phase, secretly pick one movement to photograph.
  useEffect(() => {
    if (phase !== "perform") return;
    capturePlanRef.current = {
      round,
      index: Math.floor(Math.random() * sequence.length),
    };
  }, [phase, round, sequence.length]);

  // Called by the detector for every confirmed movement.
  function handleMovement(id) {
    const plan = capturePlanRef.current;
    // results.length is the number of the attempt happening right now (0-based).
    if (plan && plan.round === round && plan.index === results.length) {
      const src = capturePortrait(videoRef.current, {
        maxWidth: SNAPSHOT_MAX_WIDTH,
      });
      if (src) snapshotsRef.current.push({ src, round, movement: LABELS[id] });
    }
    game.reportMovement(id);
  }

  const detector = useMovementDetector(posesRef, {
    enabled: phase === "perform",
    onMovement: handleMovement,
  });

  function handleStart() {
    if (!faceReady) return; // safety: never capture without a face in frame
    portraitRef.current = capturePortrait(videoRef.current);
    snapshotsRef.current = [];
    game.start();
  }

  // When the game finishes, wait briefly, then hand everything to App.
  const finish = useEffectEvent(() => {
    onComplete({
      portrait: portraitRef.current,
      snapshots: snapshotsRef.current,
      history: game.state.history,
    });
  });
  const finished = phase === "finished";

  useEffect(() => {
    if (!finished) return;
    const timeoutId = setTimeout(finish, FINISH_DELAY_MS);
    return () => clearTimeout(timeoutId);
  }, [finished]);

  const layout = layoutFor(phase);

  let cameraLabel = "Player Ready";
  if (!ready) cameraLabel = "Loading camera…";
  else if (!faceReady) cameraLabel = "Waiting for player…";

  return (
    <section className={`screen game game--${layout}`}>
      <h1 className="screen-title">{TITLES[layout]}</h1>

      {cameraError && <p className="game__error">{cameraError}</p>}
      {poseError && <p className="game__error">{poseError}</p>}

      <div className="game__body">
        <div className="game__side">
          {layout === "instructions" && <InstructionsPanel />}
          {layout === "memorise" && <MemorisePanel sequence={sequence} />}
          {layout === "perform" && (
            <PerformPanel state={game.state} inFrame={detector.inFrame} />
          )}
        </div>

        {/* The camera stays mounted in this exact spot for the whole game;
            only CSS moves or hides it, so the webcam never restarts. */}
        <div
          className="game__camera-column"
          aria-hidden={layout === "memorise"}
        >
          <div className="panel game__camera-panel">
            {layout === "instructions" && (
              <p className="game__camera-label">{cameraLabel}</p>
            )}
            <div className="game__camera">
              <video ref={videoRef} className="game__video" playsInline muted />
              <PoseOverlay
                videoRef={videoRef}
                posesRef={posesRef}
                connections={connections}
              />
            </div>
          </div>

          {layout === "instructions" && (
            <button
              type="button"
              className="button game__start"
              onClick={handleStart}
              disabled={!ready || !faceReady}
            >
              Start
            </button>
          )}
        </div>
      </div>
    </section>
  );
}

export default MovementGame;
