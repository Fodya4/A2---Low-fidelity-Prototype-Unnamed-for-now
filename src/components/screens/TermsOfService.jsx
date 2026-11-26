// Vite's "?raw" suffix imports a file's contents as a plain string.
import termsText from "../../content/terms-of-service.txt?raw";
import "./TermsOfService.css";

// Lines like "1. Acceptance of Terms" or "4.1 Information Provided by Users" are headings.
const SECTION_HEADING = /^\d+(\.\d+)?\.?\s/;

// Split the text into lines once, when the file loads (not on every render).
// trim() also removes Windows line endings if the file was saved on a PC.
const [termsTitle, ...termsLines] = termsText
  .split("\n")
  .map((line) => line.trim())
  .filter(Boolean);

// Screen 2: the consent form. There is no way to decline.
function TermsOfService({ onAccept }) {
  return (
    <section className="screen consent">
      <div className="consent__header">
        <h1 className="screen-title">Consent Form</h1>
        <p className="screen-subtitle">
          To generate your artwork, we require your consent.
        </p>
      </div>

      {/* tabIndex lets keyboard users focus the box and scroll it with arrow keys. */}
      <div
        className="panel consent__terms"
        tabIndex={0}
        role="region"
        aria-label="Terms of Service and Privacy Policy"
      >
        <h2 className="consent__terms-title">{termsTitle}</h2>
        {termsLines.map((line, index) => {
          const isHeading =
            SECTION_HEADING.test(line) || line.startsWith("Last Updated");
          return isHeading ? (
            <h3 key={index} className="consent__terms-heading">
              {line}
            </h3>
          ) : (
            <p key={index} className="consent__terms-paragraph">
              {line}
            </p>
          );
        })}
      </div>

      <button type="button" className="button" onClick={onAccept}>
        I Agree
      </button>
    </section>
  );
}

export default TermsOfService;
