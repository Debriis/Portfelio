import { useLayoutEffect, useRef } from "react";
import type { Profile } from "../../../../shared/types";
import { IdentityArtwork } from "./IdentityArtwork";
import { motion } from "../../animations/settings";
export function IntroStartup({
  profile,
  complete,
}: {
  profile: Profile;
  complete: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const cardElement = document.querySelector('.identity-trigger');
    if (!cardElement) { complete(); return; }
    const element = ref.current!,
      frame = element.getBoundingClientRect(),
      card = cardElement.getBoundingClientRect();
    const end =
      "translate(" +
      (card.x - frame.x) +
      "px," +
      (card.y - frame.y) +
      "px) scale(" +
      card.width / frame.width +
      "," +
      card.height / frame.height +
      ")";
    const animation = element.animate(
      [
        { transform: "none", offset: 0 },
        { transform: "none", offset: 0.2 },
        { transform: end, offset: 1 },
      ],
      {
        duration: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : motion.startupMs,
        easing: "cubic-bezier(.4,0,.18,1)",
        fill: "both",
      },
    );
    animation.onfinish = complete;
    return () => animation.cancel();
  }, []);
  return (
    <div ref={ref} className="identity-boot" aria-hidden="true">
      <IdentityArtwork profile={profile} />
    </div>
  );
}
