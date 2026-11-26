import { TOTAL_ROUNDS } from "./sequenceGame";

// Turns a finished game's history into the stats and tags shown on the marketplace.
// Everything here is derived from what the visitor actually did.
export function buildProfile(history) {
  const attempts = history.flatMap((round) => round.attempts);
  const totalAttempts = attempts.length;
  const correct = attempts.filter((attempt) => attempt.correct).length;
  const missed = attempts.filter((attempt) => attempt.actual === null).length;

  // Response time only counts attempts where they actually did something (not time-outs).
  const responded = attempts.filter((attempt) => attempt.actual !== null);
  const avgResponseMs = responded.length
    ? responded.reduce((sum, attempt) => sum + attempt.durationMs, 0) /
      responded.length
    : null;

  const passedRounds = history.filter((round) => round.passed);
  const longestSequence = passedRounds.length
    ? Math.max(...passedRounds.map((round) => round.length))
    : 0;

  const stats = {
    compliance: totalAttempts ? correct / totalAttempts : 0, // 0 to 1
    avgResponseMs,
    roundsPassed: passedRounds.length,
    totalRounds: TOTAL_ROUNDS,
    longestSequence,
    missed,
    totalAttempts,
  };

  return { ...stats, tags: buildTags(stats) };
}

// PLACEHOLDER wording: the group can rewrite these. Thresholds are tunable.
function buildTags({
  compliance,
  avgResponseMs,
  roundsPassed,
  totalRounds,
  missed,
}) {
  const tags = [];

  if (compliance >= 0.8) tags.push("Highly compliant");
  else if (compliance >= 0.5) tags.push("Moderately compliant");
  else tags.push("Requires behavioural correction");

  if (avgResponseMs !== null) {
    tags.push(
      avgResponseMs < 2000 ? "Fast responder" : "Hesitant under instruction"
    );
  }

  if (missed > 0) tags.push("Attention lapses detected");
  if (roundsPassed === totalRounds) tags.push("Ideal training subject");

  // Everyone kept playing to the end; how we describe that depends on how they did.
  if (compliance >= 0.5) tags.push("Follows instructions without question");
  else tags.push("Persists despite repeated failure");

  return tags;
}
