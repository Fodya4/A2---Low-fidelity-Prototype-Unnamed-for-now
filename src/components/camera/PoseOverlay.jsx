import { useEffect, useRef } from "react";

/**
 * Draws detected keypoints and skeleton lines on a canvas over the video.
 * Runs its own animation loop and reads poses from posesRef each frame,
 * so React never re-renders just because new poses arrived.
 */
function PoseOverlay({ videoRef, posesRef, connections, minConfidence = 0.3 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const ctx = canvas.getContext("2d");
    let frameId;

    function draw() {
      frameId = requestAnimationFrame(draw);

      // Video has no frames yet: nothing to draw.
      if (!video.videoWidth) return;

      // Match the canvas's internal resolution to the camera's real resolution,
      // so keypoint coordinates (which are in camera pixels) land in the right place.
      if (
        canvas.width !== video.videoWidth ||
        canvas.height !== video.videoHeight
      ) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (const pose of posesRef.current) {
        const points = pose.keypoints;

        // Skeleton lines, drawn only when both ends are confidently detected.
        ctx.strokeStyle = "#00ff88";
        ctx.lineWidth = 4;
        for (const [a, b] of connections) {
          const p = points[a];
          const q = points[b];
          if (p.confidence > minConfidence && q.confidence > minConfidence) {
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }

        // Keypoint dots.
        ctx.fillStyle = "#ff2d55";
        for (const point of points) {
          if (point.confidence > minConfidence) {
            ctx.beginPath();
            ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
    }

    draw();

    return () => cancelAnimationFrame(frameId);
  }, [videoRef, posesRef, connections, minConfidence]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}

export default PoseOverlay;
