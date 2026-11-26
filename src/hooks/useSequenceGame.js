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
  showBaseMs: 2000, // prompts stay visible this long...
  showPerMoveMs: 2000, // ...plus this much per movement, then the countdown starts
  countdownFrom: 3, // countdown starts at this number (one second per number)
  goMs: 700, // how long "Go!" stays on screen before performing starts
  moveTimeoutMs: 8000, // max time for each movement
  feedbackMs: 3000, // how long the round result stays on screen
};

export function useSequenceGame() {
  const [state, dispatch] = useReducer(gameReducer, initialGameState);
  const { phase, sequence, progress, passed } = state;

  // Memorise phase: show prompts, then start the countdown.
  useEffect(() => {
    if (phase !== "show") return;
    const duration = TIMING.showBaseMs + TIMING.showPerMoveMs * sequence.length;
    const timeoutId = setTimeout(
      () => dispatch({ type: "BEGIN_COUNTDOWN" }),
      duration
    );
    return () => clearTimeout(timeoutId);
  }, [phase, sequence]);

  // Countdown phase: 3, 2, 1, Go!, then start performing.
  useEffect(() => {
    if (phase !== "countdown") return;
    const duration = TIMING.countdownFrom * 1000 + TIMING.goMs;
    const timeoutId = setTimeout(
      () => dispatch({ type: "BEGIN_PERFORM", at: performance.now() }),
      duration
    );
    return () => clearTimeout(timeoutId);
  }, [phase]);

  // Perform phase: each movement gets its own time limit.
  // progress in the dependencies restarts the timer after every attempt.
  useEffect(() => {
    if (phase !== "perform") return;
    const timeoutId = setTimeout(
      () => dispatch({ type: "TIMEOUT", at: performance.now() }),
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
    reportMovement: (id) =>
      dispatch({ type: "MOVEMENT", id, at: performance.now() }),
    reset: () => dispatch({ type: "RESET" }),
  };
}
