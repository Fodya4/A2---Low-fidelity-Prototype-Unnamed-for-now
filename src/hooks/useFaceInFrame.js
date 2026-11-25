import { useEffect, useState } from "react";
import { isFaceVisible } from "../logic/faceCheck";

export const FACE_STABLE_MS = 800; // face must stay visible this long before counting
const TICK_MS = 100;

// Returns true once a face has been continuously visible for FACE_STABLE_MS.
// Drops back to false the moment the face leaves the frame.
export function useFaceInFrame(posesRef, { enabled = true } = {}) {
  const [faceReady, setFaceReady] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    let visibleSince = null;

    const intervalId = setInterval(() => {
      const now = performance.now();
      if (isFaceVisible(posesRef.current)) {
        if (visibleSince === null) visibleSince = now;
        setFaceReady(now - visibleSince >= FACE_STABLE_MS);
      } else {
        visibleSince = null;
        setFaceReady(false);
      }
    }, TICK_MS);

    return () => clearInterval(intervalId);
  }, [posesRef, enabled]);

  return enabled && faceReady;
}
