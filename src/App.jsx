import { useState } from "react";
import TermsOfService from "./components/screens/TermsOfService";
import MovementGame from "./components/screens/MovementGame";
import PortraitReveal from "./components/screens/PortraitReveal";
import PortraitBoard from "./components/screens/PortraitBoard";
import FinalChoice from "./components/screens/FinalChoice";
import Debrief from "./components/screens/Debrief";

const MAX_BOARD_PORTRAITS = 30;

// The visitor journey, in order:
// terms → game → reveal → board → choice → debrief → (back to terms for the next visitor)
function App() {
  const [stage, setStage] = useState("terms");
  const [currentPortrait, setCurrentPortrait] = useState(null);
  // Portraits live only in memory: a page reload clears the board.
  const [boardPortraits, setBoardPortraits] = useState([]);

  function handleGameComplete(src) {
    const portrait = src ? { id: crypto.randomUUID(), src } : null;
    setCurrentPortrait(portrait);
    if (portrait) {
      // Newest first, oldest dropped once the board is full.
      setBoardPortraits((previous) =>
        [portrait, ...previous].slice(0, MAX_BOARD_PORTRAITS)
      );
    }
    setStage("reveal");
  }

  function handleRestart() {
    setCurrentPortrait(null);
    setStage("terms");
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "system-ui" }}>
      {stage === "terms" && (
        <TermsOfService onAccept={() => setStage("game")} />
      )}
      {stage === "game" && <MovementGame onComplete={handleGameComplete} />}
      {stage === "reveal" && (
        <PortraitReveal
          portrait={currentPortrait}
          onContinue={() => setStage("board")}
        />
      )}
      {stage === "board" && (
        <PortraitBoard
          portraits={boardPortraits}
          currentId={currentPortrait?.id}
          onContinue={() => setStage("choice")}
        />
      )}
      {stage === "choice" && (
        <FinalChoice onChoose={() => setStage("debrief")} />
      )}
      {stage === "debrief" && <Debrief onFinish={handleRestart} />}
    </main>
  );
}

export default App;
