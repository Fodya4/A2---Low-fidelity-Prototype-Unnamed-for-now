import { useEffect, useRef, useState } from "react";
import { loadBodyPose } from "../lib/ml5";

/**
 * Runs BodyPose detection on a video element.
 *   videoRef: the same ref given to <video> by useCamera
 *   enabled:  only start detecting once the camera is actually ready
 * Returns:
 *   posesRef:    ref whose .current is the latest array of detected poses
 *   connections: pairs of keypoint indices for drawing the skeleton
 *   status:      'waiting' | 'loading' | 'detecting' | 'error'
 *   error:       human-readable message when status is 'error'
 */
export function useBodyPose(videoRef, { enabled = true } = {}) {
  const posesRef = useRef([]);
  const [connections, setConnections] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled) return;

    const video = videoRef.current;
    let cancelled = false;
    let model = null;

    loadBodyPose()
      .then((loadedModel) => {
        if (cancelled) return;
        model = loadedModel;
        setConnections(model.getSkeleton());
        model.detectStart(video, (results) => {
          // Ignore any results that arrive after this component unmounted.
          if (!cancelled) posesRef.current = results;
        });
        setStatus("detecting");
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setStatus("error");
      });

    return () => {
      cancelled = true;
      model?.detectStop();
    };
  }, [videoRef, enabled]);

  return {
    posesRef,
    connections,
    status: enabled ? status : "waiting",
    error,
  };
}
