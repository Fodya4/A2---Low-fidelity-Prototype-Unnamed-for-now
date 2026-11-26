import { useState } from "react";
import StartScreen from "./components/screens/StartScreen";
import TermsOfService from "./components/screens/TermsOfService";
import MovementGame from "./components/screens/MovementGame";
import AnalyzingScreen from "./components/screens/AnalyzingScreen";
import Marketplace from "./components/screens/Marketplace";
import { buildProfile } from "./logic/profile";
import { priceFor } from "./logic/pricing";
import { createAuction } from "./logic/auction";

const MAX_PARTICIPANTS = 30;

// The visitor journey, in order:
// start → consent → game (instructions + play) → analyzing → marketplace → (back to start)
function App() {
  const [stage, setStage] = useState("start");
  const [participant, setParticipant] = useState(null); // the current visitor
  // Every participant this session, newest first. Memory only: a reload clears it.
  const [participants, setParticipants] = useState([]);
  const [subjectCount, setSubjectCount] = useState(0);

  function handleGameComplete({ portrait, snapshots, history }) {
    const number = subjectCount + 1;
    const profile = buildProfile(history);
    const newParticipant = {
      id: crypto.randomUUID(),
      number,
      portrait,
      snapshots,
      profile,
      auction: createAuction(priceFor(profile)), // scripted once, played back in the marketplace
    };
    setSubjectCount(number);
    setParticipant(newParticipant);
    if (portrait) {
      setParticipants((previous) =>
        [newParticipant, ...previous].slice(0, MAX_PARTICIPANTS)
      );
    }
    setStage("analyzing");
  }

  function handleRestart() {
    setParticipant(null);
    setStage("start");
  }

  return (
    <main className="app">
      {stage === "start" && <StartScreen onBegin={() => setStage("consent")} />}
      {stage === "consent" && (
        <TermsOfService onAccept={() => setStage("game")} />
      )}
      {stage === "game" && <MovementGame onComplete={handleGameComplete} />}
      {stage === "analyzing" && (
        <AnalyzingScreen onDone={() => setStage("marketplace")} />
      )}
      {stage === "marketplace" && (
        <Marketplace
          participant={participant}
          others={participants.filter((other) => other.id !== participant.id)}
          onFinish={handleRestart}
        />
      )}
    </main>
  );
}

export default App;
