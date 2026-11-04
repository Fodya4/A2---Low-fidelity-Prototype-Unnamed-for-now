import { useState } from "react";
import { useCamera } from "./hooks/useCamera";

// Temporary test component for the camera hook.
function CameraCheck() {
  const { videoRef, status, error } = useCamera();

  return (
    <div>
      <p>
        Camera status: <strong>{status}</strong>
      </p>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <video
        ref={videoRef}
        playsInline
        muted
        style={{
          width: 640,
          maxWidth: "100%",
          transform: "scaleX(-1)",
          background: "#111",
        }}
      />
    </div>
  );
}

function App() {
  const [cameraOn, setCameraOn] = useState(true);

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>A2 Prototype: camera check</h1>
      <button type="button" onClick={() => setCameraOn((on) => !on)}>
        {cameraOn ? "Unmount camera" : "Mount camera"}
      </button>
      {cameraOn && <CameraCheck />}
    </main>
  );
}

export default App;
