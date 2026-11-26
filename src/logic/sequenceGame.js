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
// phase: 'idle' → 'show' (memorise) → 'countdown' → 'perform' → 'feedback'
//        → next round... → 'finished'

export const initialGameState = {
  phase: "idle",
  round: 0,
  sequence: [],
  progress: 0, // how many movements in this round have been attempted
  results: [], // one true/false per attempted movement this round (for the UI)
  attempts: [], // full record of each attempt this round (for the profile)
  moveStartedAt: null, // when the current movement's timer started
  passed: null, // whether the round just finished was fully correct
  history: [], // one entry per finished round, including its attempts
};

// Records one attempt and ends the round after the last movement.
// actual is the movement the visitor did, or null for a time-out.
// at is the time of the attempt, supplied by the hook (reducers can't read the clock).
function recordAttempt(state, { correct, actual, at }) {
  const attempt = {
    expected: state.sequence[state.progress],
    actual,
    correct,
    durationMs: at - state.moveStartedAt,
  };
  const results = [...state.results, correct];
  const attempts = [...state.attempts, attempt];
  const progress = state.progress + 1;

  if (progress < state.sequence.length) {
    // The next movement's timer starts now.
    return { ...state, progress, results, attempts, moveStartedAt: at };
  }

  const passed = results.every(Boolean);
  return {
    ...state,
    phase: "feedback",
    progress,
    results,
    attempts,
    passed,
    history: [
      ...state.history,
      { round: state.round, length: state.sequence.length, passed, attempts },
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

    case "BEGIN_COUNTDOWN":
      if (state.phase !== "show") return state;
      return { ...state, phase: "countdown" };

    case "BEGIN_PERFORM":
      if (state.phase !== "countdown") return state;
      return {
        ...state,
        phase: "perform",
        progress: 0,
        results: [],
        attempts: [],
        moveStartedAt: action.at,
      };

    case "MOVEMENT": {
      if (state.phase !== "perform") return state;
      const expected = state.sequence[state.progress];
      return recordAttempt(state, {
        correct: action.id === expected,
        actual: action.id,
        at: action.at,
      });
    }

    case "TIMEOUT":
      // No movement in time: counts as a missed movement, then the round continues.
      if (state.phase !== "perform") return state;
      return recordAttempt(state, {
        correct: false,
        actual: null,
        at: action.at,
      });

    case "NEXT_ROUND":
      if (state.phase !== "feedback") return state;
      if (state.round >= TOTAL_ROUNDS) return { ...state, phase: "finished" };
      return {
        ...state,
        phase: "show",
        round: state.round + 1,
        sequence: action.sequence,
        progress: 0,
        results: [],
        attempts: [],
        moveStartedAt: null,
        passed: null,
      };

    case "RESET":
      return initialGameState;

    default:
      return state;
  }
}

// --- Progress bar value (0 to 1) ---
// Every attempt fills the bar, right or wrong: the bar always reaches 100%,
// because the outcome never actually depended on performance.
export function gameProgress(state) {
  if (state.phase === "idle") return 0;
  if (state.phase === "finished") return 1;
  const finishedRounds = state.history.length;
  const withinRound =
    state.phase === "perform" ? state.progress / state.sequence.length : 0;
  return Math.min(1, (finishedRounds + withinRound) / TOTAL_ROUNDS);
}
