// The only file in the project that touches window.ml5.
// Loads the BodyPose model once and shares it with every component that needs it.

let bodyPosePromise = null;

const LOAD_TIMEOUT_MS = 30000;

export function loadBodyPose() {
  // Already loading or loaded: reuse the same model instead of downloading it again.
  if (bodyPosePromise) return bodyPosePromise;

  const ml5 = window.ml5;
  if (!ml5?.bodyPose) {
    return Promise.reject(
      new Error("ml5.js is not loaded. Check the script tag in index.html.")
    );
  }

  bodyPosePromise = new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(
        new Error(
          "The pose model took too long to load. Check the internet connection and reload."
        )
      );
    }, LOAD_TIMEOUT_MS);

    try {
      // flipped: true mirrors the keypoint coordinates so they line up
      // with our mirrored (scaleX(-1)) video display.
      const model = ml5.bodyPose("MoveNet", { flipped: true }, () => {
        clearTimeout(timer);
        resolve(model);
      });
    } catch (err) {
      clearTimeout(timer);
      reject(err);
    }
  });

  // If loading fails, forget the failed attempt so a later call can retry.
  bodyPosePromise.catch(() => {
    bodyPosePromise = null;
  });

  return bodyPosePromise;
}
