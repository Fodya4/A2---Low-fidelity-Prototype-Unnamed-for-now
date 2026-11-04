// Small helpers for reading ml5 BodyPose results.
// No React here: these are plain functions, easy to test and reuse.

// Below this confidence, MoveNet is basically guessing, so we treat the point as not visible.
export const MIN_CONFIDENCE = 0.3;

// Pick the person closest to the camera (largest bounding box) and ignore everyone else,
// so a bystander walking behind the visitor can't affect the game.
export function getMainPose(poses) {
  if (!poses?.length) return null;
  return poses.reduce((best, pose) =>
    boxArea(pose) > boxArea(best) ? pose : best
  );
}

function boxArea(pose) {
  const box = pose.box;
  if (!box) return 0;
  const width = box.width ?? box.xMax - box.xMin;
  const height = box.height ?? box.yMax - box.yMin;
  return width * height;
}

// Returns the keypoint with this name (e.g. "right_wrist") if it's confidently detected, otherwise null.
export function getKeypoint(pose, name) {
  const point = pose.keypoints.find((keypoint) => keypoint.name === name);
  if (!point || point.confidence < MIN_CONFIDENCE) return null;
  return point;
}

// Straight-line distance between two points, in pixels.
export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
