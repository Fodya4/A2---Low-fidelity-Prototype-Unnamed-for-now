import { useState } from "react";

// Visitors must tick the box to continue. There is no way to decline.
function TermsOfService({ onAccept }) {
  const [agreed, setAgreed] = useState(false);

  return (
    <section style={{ maxWidth: 640 }}>
      <h1>Terms of Service</h1>

      <div
        style={{
          height: 260,
          overflowY: "auto",
          border: "1px solid #555",
          padding: "1rem",
          fontSize: "0.85rem",
          lineHeight: 1.6,
        }}
      >
        {/* PLACEHOLDER: the group writes the real terms text. */}
        <p>
          By continuing, you agree to participate in this interactive
          experience.
        </p>
        <p>
          The system will use your device camera to track body movement during
          the experience. Data may be processed to improve your experience and
          the experience of others.
        </p>
        <p>
          Section 1. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
        </p>
        <p>
          Section 2. Sed do eiusmod tempor incididunt ut labore et dolore magna
          aliqua.
        </p>
        <p>
          Section 3. Ut enim ad minim veniam, quis nostrud exercitation ullamco
          laboris.
        </p>
        <p>
          Section 4. Duis aute irure dolor in reprehenderit in voluptate velit
          esse.
        </p>
        <p>
          Section 5. Excepteur sint occaecat cupidatat non proident, sunt in
          culpa.
        </p>
      </div>

      <label style={{ display: "flex", gap: "0.5rem", margin: "1rem 0" }}>
        <input
          type="checkbox"
          checked={agreed}
          onChange={(e) => setAgreed(e.target.checked)}
        />
        I have read and agree to the Terms of Service
      </label>

      <button type="button" onClick={onAccept} disabled={!agreed}>
        Continue
      </button>
    </section>
  );
}

export default TermsOfService;
