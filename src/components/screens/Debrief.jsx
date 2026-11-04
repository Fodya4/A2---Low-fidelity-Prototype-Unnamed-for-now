import { useEffect, useEffectEvent } from "react";

const AUTO_RETURN_MS = 20000; // return to the start for the next visitor

// The ending. Tells visitors honestly what happened to their image (the debrief).
function Debrief({ onFinish }) {
  const finish = useEffectEvent(() => onFinish());

  useEffect(() => {
    const timeoutId = setTimeout(finish, AUTO_RETURN_MS);
    return () => clearTimeout(timeoutId);
  }, []);

  return (
    <section style={{ maxWidth: 640 }}>
      {/* PLACEHOLDER copy: must match what the instructor approves for debriefing. */}
      <h1>Thank you for participating</h1>
      <p>
        Your choice did not change the outcome. Your portrait was taken when you
        pressed Start.
      </p>
      <p>
        Your portrait exists only in this computer's memory for this session. It
        has not been saved to disk or sent anywhere, and it will be deleted when
        the installation is reset.
      </p>
      <button type="button" onClick={onFinish}>
        Finish
      </button>
    </section>
  );
}

export default Debrief;
