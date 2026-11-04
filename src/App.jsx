// Temporary foundation check: confirms ml5 is available inside React.
// This file gets replaced once we start the webcam milestone.
function App() {
  const ml5Loaded = typeof window.ml5 !== "undefined";

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      <h1>A2 Prototype: foundation check</h1>
      <p>ml5.js: {ml5Loaded ? "✅ loaded" : "❌ not found"}</p>
      {ml5Loaded && (
        <p>
          bodyPose available:{" "}
          {typeof window.ml5.bodyPose === "function" ? "✅" : "❌"}
        </p>
      )}
    </main>
  );
}

export default App;
