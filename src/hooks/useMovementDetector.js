import { useEffect, useEffectEvent, useState } from "react";
import { getMainPose } from "../logic/poseUtils";
import { MOVEMENTS, evaluateMovements } from "../logic/movements";

export const HOLD_MS = 500; // a movement must be held this long to count
export const NEUTRAL_MS = 300; // arms must be down this long before the next movement counts
const TICK_MS = 50; // how often we check the latest pose

/**
 * Watches poses and calls onMovement(id) once per confirmed movement.
 * Rules:
 *   1. Hold to confirm: brief flickers and in-between poses are ignored.
 *   2. Return to neutral: after each movement, arms must come down before the next one counts.
 * Returns:
 *   inFrame:           false when the visitor's shoulders aren't visible
 *   waitingForNeutral: true while we're waiting for arms to come down
 */
export function useMovementDetector(posesRef, { enabled, onMovement }) {
  const [inFrame, setInFrame] = useState(true);
  const [waitingForNeutral, setWaitingForNeutral] = useState(true);

  // Always calls the latest onMovement without restarting the detection loop.
  const emitMovement = useEffectEvent((id) => onMovement(id));

  useEffect(() => {
    if (!enabled) return;

    let needsNeutral = true; // start each round by requiring arms down
    let candidate = null; // the movement (or null = neutral) currently being held
    let since = 0; // when the current candidate started

    const intervalId = setInterval(() => {
      const now = performance.now();
      const results = evaluateMovements(getMainPose(posesRef.current));
      const visible = results[MOVEMENTS[0].id] !== null;
      const active =
        MOVEMENTS.find((movement) => results[movement.id] === true)?.id ?? null;

      setInFrame(visible);
      setWaitingForNeutral(needsNeutral);

      if (!visible) {
        candidate = null;
        return;
      }

      // Pose changed: restart the hold timer.
      if (active !== candidate) {
        candidate = active;
        since = now;
        return;
      }

      const heldFor = now - since;

      if (needsNeutral) {
        if (active === null && heldFor >= NEUTRAL_MS) needsNeutral = false;
        return;
      }

      if (active !== null && heldFor >= HOLD_MS) {
        emitMovement(active);
        needsNeutral = true;
      }
    }, TICK_MS);

    return () => clearInterval(intervalId);
  }, [posesRef, enabled]);

  return { inFrame, waitingForNeutral };
}
