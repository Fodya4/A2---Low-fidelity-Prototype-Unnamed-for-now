import { getKeypoint, distance } from "./poseUtils";

// If raising your real right hand lights up "left" in the test screen,
// set this to true. It swaps which side the rules treat as "right".
const SIDES_SWAPPED = false;

// All tuning numbers in one place, measured in shoulder widths (not pixels),
// so the rules work whether the visitor stands near or far.
export const THRESHOLDS = {
  raisedAboveShoulder: 1.0, // wrist must be this far above its shoulder to count as raised
  headReach: 1.0, // wrist within this distance of the nose counts as "on head"
  tPoseLevel: 0.5, // for T-pose, wrist can be at most this far above/below the shoulder
  tPoseReach: 0.8, // for T-pose, wrist must be this far out beyond the shoulder
};

// Collects the points the rules need. Returns null if the shoulders aren't visible,
// which means "can't tell": the person isn't properly in frame.
function readBody(pose) {
  const right = SIDES_SWAPPED ? "left" : "right";
  const left = SIDES_SWAPPED ? "right" : "left";

  const rightShoulder = getKeypoint(pose, `${right}_shoulder`);
  const leftShoulder = getKeypoint(pose, `${left}_shoulder`);
  if (!rightShoulder || !leftShoulder) return null;

  return {
    rightShoulder,
    leftShoulder,
    rightWrist: getKeypoint(pose, `${right}_wrist`),
    leftWrist: getKeypoint(pose, `${left}_wrist`),
    nose: getKeypoint(pose, "nose"),
    shoulderWidth: distance(rightShoulder, leftShoulder),
    centerX: (rightShoulder.x + leftShoulder.x) / 2,
  };
}

// --- Building blocks: one hand at a time. side is 'right' or 'left'. ---

function handRaised(body, side) {
  const wrist = body[`${side}Wrist`];
  const shoulder = body[`${side}Shoulder`];
  if (!wrist) return false; // hidden wrist = hand is down, out of frame
  // Smaller y means higher on screen.
  return (
    wrist.y < shoulder.y - THRESHOLDS.raisedAboveShoulder * body.shoulderWidth
  );
}

function handOnHead(body, side) {
  const wrist = body[`${side}Wrist`];
  const shoulder = body[`${side}Shoulder`];
  if (!wrist || !body.nose) return false;
  return (
    wrist.y < shoulder.y &&
    distance(wrist, body.nose) < THRESHOLDS.headReach * body.shoulderWidth
  );
}

function armOut(body, side) {
  const wrist = body[`${side}Wrist`];
  const shoulder = body[`${side}Shoulder`];
  if (!wrist) return false;
  const level =
    Math.abs(wrist.y - shoulder.y) < THRESHOLDS.tPoseLevel * body.shoulderWidth;
  const out =
    Math.abs(wrist.x - body.centerX) >
    Math.abs(shoulder.x - body.centerX) +
      THRESHOLDS.tPoseReach * body.shoulderWidth;
  return level && out;
}

// --- The five movements. The game will use these ids and labels. ---

export const MOVEMENTS = [
  {
    id: "raiseRightHand",
    label: "Raise your right hand",
    check: (b) =>
      handRaised(b, "right") &&
      !handOnHead(b, "right") &&
      !handRaised(b, "left"),
  },
  {
    id: "raiseLeftHand",
    label: "Raise your left hand",
    check: (b) =>
      handRaised(b, "left") &&
      !handOnHead(b, "left") &&
      !handRaised(b, "right"),
  },
  {
    id: "bothHandsUp",
    label: "Raise both hands",
    check: (b) =>
      handRaised(b, "right") &&
      handRaised(b, "left") &&
      !handOnHead(b, "right") &&
      !handOnHead(b, "left"),
  },
  {
    id: "tPose",
    label: "Arms out to the sides",
    check: (b) => armOut(b, "right") && armOut(b, "left"),
  },
  {
    id: "handsOnHead",
    label: "Put both hands on your head",
    check: (b) => handOnHead(b, "right") && handOnHead(b, "left"),
  },
];

// Checks every movement against one pose.
// Returns e.g. { raiseRightHand: true, tPose: false, ... }, or null values if the person isn't in frame.
export function evaluateMovements(pose) {
  const body = pose ? readBody(pose) : null;
  return Object.fromEntries(
    MOVEMENTS.map((movement) => [
      movement.id,
      body ? movement.check(body) : null,
    ])
  );
}
