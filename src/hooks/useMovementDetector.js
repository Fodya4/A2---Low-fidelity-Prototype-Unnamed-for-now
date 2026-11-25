import { useEffect, useEffectEvent, useState } from "react";
import { getMainPose } from "../logic/poseUtils";
import { MOVEMENTS, evaluateMovements } from "../logic/movements";

export const HOLD_MS = 500; // a movement must be held this long to count
const TICK_MS = 50; // how often we check the latest pose

/**
 * Watches poses and calls onMovement(id) once per confirmed movement.
 * Rules:
 *   1. Hold to confirm: brief flickers and in-between poses are ignored.
 *   2. No repeats: the movement that registered last can't register again.
 *      Sequences never repeat a movement back to back, so visitors can go
 *      straight from one pose to the next without lowering their arms.
 *   A pose already held when detection starts (e.g. someone getting ready
 *   during the countdown) counts once it has been held long enough.
 * Returns:
 *   inFrame: false when the visitor's shoulders aren't visible
 */
export function useMovementDetector(posesRef, { enabled, onMovement }) {
  const [inFrame, setInFrame] = useState(true);

  // Always calls the latest onMovement without restarting the detection loop.
  const emitMovement = useEffectEvent((id) => onMovement(id));

  useEffect(() => {
    if (!enabled) return;

    let lastRegistered = null; // the movement that registered most recently
    let candidate = null; // the movement (or null = no movement) currently being held
    let since = performance.now(); // when the current candidate started
    let eligible = true; // whether the current candidate is allowed to register

    const intervalId = setInterval(() => {
      const now = performance.now();
      const results = evaluateMovements(getMainPose(posesRef.current));
      const visible = results[MOVEMENTS[0].id] !== null;
      const active =
        MOVEMENTS.find((movement) => results[movement.id] === true)?.id ?? null;

      setInFrame(visible);

      if (!visible) {
        candidate = null;
        since = now;
        return;
      }

      // Pose changed: restart the hold timer, and the new pose may register.
      if (active !== candidate) {
        candidate = active;
        since = now;
        eligible = true;
        return;
      }

      const heldLongEnough = now - since >= HOLD_MS;
      if (
        eligible &&
        active !== null &&
        active !== lastRegistered &&
        heldLongEnough
      ) {
        emitMovement(active);
        lastRegistered = active;
        eligible = false;
      }
    }, TICK_MS);

    return () => clearInterval(intervalId);
  }, [posesRef, enabled]);

  return { inFrame };
}
