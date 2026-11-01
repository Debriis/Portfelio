import type { Profile } from "../../../../shared/types";
import { IdentityArtwork } from "./IdentityArtwork";
export interface ArtworkOrigin {
  x: number;
  y: number;
  width: number;
  height: number;
}
export function Identity({
  profile,
  open,
}: {
  profile: Profile;
  open: (origin: ArtworkOrigin, keyboard: boolean) => void;
}) {
  return (
    <section className="identity" aria-label={profile.introduction}>
      <div className="identity-top">INDEPENDENT IDEAS. INTERACTIVE WORLDS.</div>
      <button
        className="identity-trigger"
        aria-label={`Expand ${profile.name}’s interactive introduction`}
        onClick={(e) =>
          open(e.currentTarget.getBoundingClientRect(), e.detail === 0)
        }
      >
        <span aria-hidden="true">
          <IdentityArtwork profile={profile} />
        </span>
        <span className="identity-open-hint" aria-hidden="true">
          CLICK TO TUNE IN ↗
        </span>
      </button>
      <h1>{profile.introduction}</h1>
      <p>{profile.supportingText}</p>
      <div className="identity-bottom">
        <span>GAMES / WEB / APPS</span>
        <span>MADE OF CURIOSITY ↗</span>
      </div>
    </section>
  );
}
