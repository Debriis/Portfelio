import type { Profile } from "../../../../shared/types";
export function IdentityArtwork({ profile }: { profile: Profile }) {
  return (
    <div className="identity-art">
      <picture>
        <source
          media="(max-width:700px) and (orientation:portrait), (max-aspect-ratio:4/5)"
          srcSet="/assets/ayush-studio-portrait.jpg"
        />
        <img
          className="studio-artwork"
          src="/assets/ayush-studio.jpg"
          width="1774"
          height="887"
          alt={
            profile.introduction +
            " Original black-and-white cartoon of a raccoon developer in a studio, with yellow AYUSH lettering."
          }
          draggable={false}
          fetchPriority="high"
        />
      </picture>
    </div>
  );
}
