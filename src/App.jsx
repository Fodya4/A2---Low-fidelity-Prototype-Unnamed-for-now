import { useState } from "react";
import { useCamera } from "./hooks/useCamera";
import { useBodyPose } from "./hooks/useBodyPose";
import PoseOverlay from "./components/camera/PoseOverlay";

// Temporary test component: camera + BodyPose + landmark overlay.
function PoseCheck() {
  const { videoRef, status: cameraStatus, error: cameraError } = useCamera();
  const {
    posesRef,
    connections,
    status: poseStatus,
    error: poseError,
  } = useBodyPose(videoRef, { enabled: cameraStatus === "ready" });

  function logPoses() {
    console.log("Current poses:", posesRef.current);
  }

  return (
    <div>
      <p>
        Camera: <strong>{cameraStatus}</strong> · Pose model:{" "}
        <strong>{poseStatus}</strong>
      </p>
      {cameraError && <p style={{ color: "crimson" }}>{cameraError}</p>}
      {poseError && <p style={{ color: "crimson" }}>{poseError}</p>}

      <button type="button" onClick={logPoses}>
        Log current poses to console
      </button>

      {/* Wrapper is position: relative so the canvas can sit exactly on top of the video. */}
      <div
        style={{
          position: "relative",
          width: 640,
          maxWidth: "100%",
          marginTop: "1rem",
        }}
      >
        <video
          ref={videoRef}
          playsInline
          muted
          style={{
            display: "block",
            width: "100%",
            height: "auto", // the height attribute is now set for ml5; CSS keeps proportions
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
    </div>
  );
}

function App() {
  const [on, setOn] = useState(true);

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>A2 Prototype: pose check</h1>
      <button type="button" onClick={() => setOn((value) => !value)}>
        {on ? "Unmount" : "Mount"}
      </button>
      {on && <PoseCheck />}
    </main>
  );
}

export default App;
