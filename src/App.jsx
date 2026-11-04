import { useEffect, useState } from "react";
import { useCamera } from "./hooks/useCamera";
import { useBodyPose } from "./hooks/useBodyPose";
import PoseOverlay from "./components/camera/PoseOverlay";
import { getMainPose } from "./logic/poseUtils";
import { MOVEMENTS, evaluateMovements } from "./logic/movements";

// Reads the latest pose 10 times per second and evaluates every movement rule.
// 10x/second is plenty for a readable display and keeps re-renders low.
function useMovementResults(posesRef) {
  const [results, setResults] = useState(() => evaluateMovements(null));

  useEffect(() => {
    const intervalId = setInterval(() => {
      const pose = getMainPose(posesRef.current);
      setResults(evaluateMovements(pose));
    }, 100);
    return () => clearInterval(intervalId);
  }, [posesRef]);

  return results;
}

function resultIcon(value) {
  if (value === null) return "—"; // can't tell: shoulders not in frame
  return value ? "✅" : "⬜";
}

// Temporary test component: live movement detection.
function MovementCheck() {
  const { videoRef, status: cameraStatus, error: cameraError } = useCamera();
  const {
    posesRef,
    connections,
    status: poseStatus,
    error: poseError,
  } = useBodyPose(videoRef, { enabled: cameraStatus === "ready" });
  const results = useMovementResults(posesRef);

  return (
    <div>
      <p>
        Camera: <strong>{cameraStatus}</strong> · Pose model:{" "}
        <strong>{poseStatus}</strong>
      </p>
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

        <ul
          style={{
            listStyle: "none",
            padding: 0,
            fontSize: "1.25rem",
            lineHeight: 2,
          }}
        >
          {MOVEMENTS.map((movement) => (
            <li key={movement.id}>
              {resultIcon(results[movement.id])} {movement.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function App() {
  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>A2 Prototype: movement check</h1>
      <MovementCheck />
    </main>
  );
}

export default App;
