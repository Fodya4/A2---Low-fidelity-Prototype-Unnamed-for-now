import { getMainPose } from "./poseUtils";

// Stricter than the movement threshold: the photo needs a clearly visible face.
export const FACE_CONFIDENCE = 0.5;
const FACE_POINTS = ["nose", "left_eye", "right_eye"];

// True when the main person's nose and both eyes are confidently detected.
export function isFaceVisible(poses) {
  const pose = getMainPose(poses);
  if (!pose) return false;
  return FACE_POINTS.every((name) => {
    const point = pose.keypoints.find((keypoint) => keypoint.name === name);
    return point && point.confidence >= FACE_CONFIDENCE;
  });
}
