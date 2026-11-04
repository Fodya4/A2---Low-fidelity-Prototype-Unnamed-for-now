import { useEffect, useRef, useState } from "react";

// Turns browser error names into messages a person can act on.
function describeCameraError(err) {
  switch (err?.name) {
    case "NotAllowedError":
      return "Camera permission was denied. Allow camera access in the browser and reload.";
    case "NotFoundError":
      return "No camera was found on this device.";
    case "NotReadableError":
      return "The camera is in use by another app (Zoom, FaceTime, etc.). Close it and reload.";
    case "OverconstrainedError":
      return "The camera does not support the requested settings.";
    default:
      return `Could not start the camera: ${err?.message ?? "unknown error"}`;
  }
}

const cameraSupported =
  typeof navigator !== "undefined" && !!navigator.mediaDevices?.getUserMedia;

/**
 * Starts the webcam when the component using it mounts and stops it on unmount.
 * Returns:
 *   videoRef: attach to a <video> element
 *   status:   'requesting' | 'ready' | 'error'
 *   error:    human-readable message when status is 'error'
 */
export function useCamera({ width = 640, height = 480 } = {}) {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("requesting");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!cameraSupported) return;

    const video = videoRef.current;
    let stream = null;
    let cancelled = false;

    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: width },
            height: { ideal: height },
            facingMode: "user",
          },
          audio: false,
        });

        // If the component unmounted while the permission prompt was open,
        // release the camera immediately instead of leaving it running.
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        video.srcObject = stream;
        await video.play();

        // TensorFlow.js (used by ml5) reads the video's width/height ATTRIBUTES,
        // not its real resolution. Without this, the model sees a 0x0 image.
        // CSS still controls how big the video looks on screen.
        video.width = video.videoWidth;
        video.height = video.videoHeight;

        if (!cancelled) setStatus("ready");
      } catch (err) {
        if (cancelled) return;
        setError(describeCameraError(err));
        setStatus("error");
      }
    }

    start();

    // Cleanup: runs on unmount (and once extra in dev because of StrictMode).
    return () => {
      cancelled = true;
      stream?.getTracks().forEach((track) => track.stop());
      video.srcObject = null;
    };
  }, [width, height]);

  if (!cameraSupported) {
    return {
      videoRef,
      status: "error",
      error: "This browser does not support camera access.",
    };
  }

  return { videoRef, status, error };
}
