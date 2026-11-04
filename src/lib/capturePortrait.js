// Captures the current video frame as a JPEG image (a data URL string).
// The image only exists in memory; nothing is saved or uploaded.

export function capturePortrait(video, { maxWidth = 480, quality = 0.8 } = {}) {
  if (!video?.videoWidth) return null;

  // Scale down: a smaller image is plenty for the board and uses less memory.
  const scale = Math.min(1, maxWidth / video.videoWidth);
  const width = Math.round(video.videoWidth * scale);
  const height = Math.round(video.videoHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Mirror the image so the portrait matches what the visitor saw on screen.
  ctx.translate(width, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, width, height);

  return canvas.toDataURL("image/jpeg", quality);
}
