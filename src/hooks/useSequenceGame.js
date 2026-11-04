import { useEffect, useReducer } from "react";
import {
  gameReducer,
  initialGameState,
  createSequence,
  buildNextSequence,
  START_LENGTH,
} from "../logic/sequenceGame";

// All timings in one place for easy tuning.
export const TIMING = {
  showBaseMs: 1500, // prompts stay visible this long...
  showPerMoveMs: 1500, // ...plus this much per movement, then disappear
  moveTimeoutMs: 6000, // max time for each movement (includes lowering arms first)
  feedbackMs: 2500, // how long "correct"/"incorrect" stays on screen
};

export function useSequenceGame() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const { phase, sequence, progress, passed } = state;

  // Memorise phase: show prompts, then hide them and start performing.
  useEffect(() => {
    if (phase !== "show") return;
    const duration = TIMING.showBaseMs + TIMING.showPerMoveMs * sequence.length;
    const timeoutId = setTimeout(
      () => dispatch({ type: "BEGIN_PERFORM" }),
      duration
    );
    return () => clearTimeout(timeoutId);
  }, [phase, sequence]);

  // Perform phase: each movement gets its own time limit.
  // progress in the dependencies restarts the timer after every correct move.
  useEffect(() => {
    if (phase !== "perform") return;
    const timeoutId = setTimeout(
      () => dispatch({ type: "TIMEOUT" }),
      TIMING.moveTimeoutMs
    );
    return () => clearTimeout(timeoutId);
  }, [phase, progress]);

  // Feedback phase: pause, then build the next round's sequence and move on.
  useEffect(() => {
    if (phase !== "feedback") return;
    const timeoutId = setTimeout(() => {
      dispatch({
        type: "NEXT_ROUND",
        sequence: buildNextSequence(sequence, passed),
      });
    }, TIMING.feedbackMs);
    return () => clearTimeout(timeoutId);
  }, [phase, sequence, passed]);

  return {
    state,
    start: () =>
      dispatch({ type: "START", sequence: createSequence(START_LENGTH) }),
    reportMovement: (id) => dispatch({ type: "MOVEMENT", id }),
    reset: () => dispatch({ type: "RESET" }),
  };
}
