import { MOVEMENTS } from "./movements";

export const TOTAL_ROUNDS = 5;
export const START_LENGTH = 2;

// --- Building sequences ---

// Random movement id, never the same as the previous one
// (the same move twice in a row is confusing to perform and to detect).
function randomMovementId(excludeId) {
  const options = MOVEMENTS.filter((movement) => movement.id !== excludeId);
  return options[Math.floor(Math.random() * options.length)].id;
}

export function createSequence(length) {
  const sequence = [];
  while (sequence.length < length) {
    sequence.push(randomMovementId(sequence.at(-1)));
  }
  return sequence;
}

// Passed: same sequence plus one new movement (Simon-style).
// Failed: a fresh sequence of the same length (no retrying the one they failed).
export function buildNextSequence(sequence, passed) {
  if (passed) return [...sequence, randomMovementId(sequence.at(-1))];
  return createSequence(sequence.length);
}

// --- Game state ---
// phase: 'idle' → 'show' (memorise) → 'perform' → 'feedback' → next round... → 'finished'

export const initialGameState = {
  phase: "idle",
  round: 0,
  sequence: [],
  progress: 0, // how many movements in this round were done correctly
  passed: null, // result of the round just finished
  history: [], // one entry per finished round
};

function endRound(state, passed) {
  return {
    ...state,
    phase: "feedback",
    passed,
    history: [
      ...state.history,
      { round: state.round, length: state.sequence.length, passed },
    ],
  };
}

export function gameReducer(state, action) {
  switch (action.type) {
    case "START":
      return {
        ...initialGameState,
        phase: "show",
        round: 1,
        sequence: action.sequence,
      };

    case "BEGIN_PERFORM":
      if (state.phase !== "show") return state;
      return { ...state, phase: "perform", progress: 0 };

    case "MOVEMENT": {
      if (state.phase !== "perform") return state;
      const expected = state.sequence[state.progress];
      if (action.id !== expected) return endRound(state, false); // wrong move: round over
      const progress = state.progress + 1;
      if (progress === state.sequence.length)
        return endRound({ ...state, progress }, true);
      return { ...state, progress };
    }

    case "TIMEOUT":
      if (state.phase !== "perform") return state;
      return endRound(state, false);

    case "NEXT_ROUND":
      if (state.phase !== "feedback") return state;
      if (state.round >= TOTAL_ROUNDS) return { ...state, phase: "finished" };
      return {
        ...state,
        phase: "show",
        round: state.round + 1,
        sequence: action.sequence,
        progress: 0,
        passed: null,
      };

    case "RESET":
      return initialGameState;

    default:
      return state;
  }
}

// --- Progress bar value (0 to 1) ---
// Finished rounds count fully, pass or fail: the bar always reaches 100%,
// because the outcome never actually depended on performance.
// During a round, each correct movement adds a slice of that round.
export function gameProgress(state) {
  if (state.phase === "idle") return 0;
  if (state.phase === "finished") return 1;
  const finishedRounds = state.history.length;
  const withinRound =
    state.phase === "perform" ? state.progress / state.sequence.length : 0;
  return Math.min(1, (finishedRounds + withinRound) / TOTAL_ROUNDS);
}
