import type { Profile } from "../../../../shared/types";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { safeUrl } from "../../services/api";
const controls = [
  ["DRAG", "Look around the board"],
  ["WHEEL / PINCH / + −", "Zoom in and out"],
  ["ARROWS", "Move the board / change project"],
  ["ENTER / SPACE", "Open a project / Space returns"],
  ["ESC / BACKSPACE", "Return to the board"],
  ["HOME", "Reset position and zoom"],
  ["PGUP / PGDN", "Previous / next channel"],
  ["R", "Open a random project"],
  ["1–9", "Select a project channel"],
  ["TAB", "Walk through controls"],
  ["?", "Tune in to this page"],
];
export function Help({
  profile,
  reset,
  shortcuts,
  toggle,
  close,
}: {
  profile: Profile;
  reset: () => void;
  shortcuts: boolean;
  toggle: () => void;
  close: () => void;
}) {
  const ref = useDialogFocus();
  return (
    <section
      className="teletext help-view"
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Help and controls"
    >
      <div className="teletext-header">
        <span>000 — HELP</span>
        <span>HOW TO TUNE IN</span>
        <button onClick={close}>CLOSE ×</button>
      </div>
      <div className="help-scroll">
        <p className="help-intro">{profile.introduction}</p>
        <p>{profile.supportingText}</p>
        <div className="social-links">
          {profile.socials
            .filter((s) => safeUrl(s.url))
            .map((s) => (
              <a key={s.label} href={s.url} target="_blank" rel="noreferrer">
                {s.label} ↗
              </a>
            ))}
        </div>
        <div className="help-grid">
          {controls.map(([key, description]) => (
            <div key={key}>
              <h2>{key}</h2>
              <p>{description}</p>
            </div>
          ))}
          <div>
            <h2>SHORTCUTS</h2>
            <button
              className="shortcut-switch"
              role="switch"
              aria-checked={shortcuts}
              onClick={toggle}
            >
              SINGLE KEYS: {shortcuts ? "ON ●" : "OFF ○"}
            </button>
            <p>Saved on this device. Escape and Tab always work.</p>
          </div>
        </div>
        <div className="help-footer">
          <button onClick={reset}>HOME / RESET BOARD ↗</button>
          <span>✳</span>
        </div>
      </div>
    </section>
  );
}
