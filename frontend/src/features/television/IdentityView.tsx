import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PointerEvent } from "react";
import type { Profile } from "../../../../shared/types";
import type { ArtworkOrigin } from "./Identity";
import { IdentityArtwork } from "./IdentityArtwork";
import { CrtOptics } from "./CrtOptics";
import { HelpBadge, ContactBadge } from "./Stickers";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { motion } from "../../animations/settings";
import { passedDragThreshold, type Point } from "../board/geometry";
import "./identity-view.css";
export function IdentityView({
  profile,
  origin,
  shortcuts,
  onClose,
  onHelp,
  onContact,
}: {
  profile: Profile;
  origin: ArtworkOrigin;
  shortcuts: boolean;
  onClose: () => void;
  onHelp: () => void;
  onContact: () => void;
}) {
  const ref = useDialogFocus(),
    scene = useRef<HTMLDivElement>(null),
    animation = useRef<Animation | null>(null),
    lastTransform = useRef("none");
  const [closing, setClosing] = useState(false);
  const gesture = useRef<{ origin: Point | null; dragged: boolean }>({
    origin: null,
    dragged: false,
  });
  useLayoutEffect(() => {
    const element = scene.current!,
      target = element.getBoundingClientRect();
    const card = closing
      ? document.querySelector(".identity-trigger")?.getBoundingClientRect() ||
        origin
      : origin;
    const small =
      "translate(" +
      (card.x - target.x) +
      "px," +
      (card.y - target.y) +
      "px) scale(" +
      card.width / target.width +
      "," +
      card.height / target.height +
      ")";
    animation.current = element.animate(
      closing
        ? [{ transform: lastTransform.current }, { transform: small }]
        : [{ transform: small }, { transform: "none" }],
      {
        duration: matchMedia("(prefers-reduced-motion: reduce)").matches
          ? 0
          : motion.identityMs,
        easing: "cubic-bezier(.2,.75,.15,1)",
        fill: "both",
      },
    );
    animation.current.onfinish = () => {
      if (closing) onClose();
    };
    return () => {
      lastTransform.current = getComputedStyle(element).transform;
      animation.current?.cancel();
    };
  }, [closing, origin]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (
        e.key === "Escape" ||
        (shortcuts &&
          (e.key === "Backspace" ||
            (e.key === " " &&
              !(
                e.target instanceof HTMLElement && e.target.closest("button")
              ))))
      ) {
        e.preventDefault();
        setClosing(true);
      }
    };
    window.addEventListener("keydown", key);
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", key);
      document.body.style.overflow = before;
    };
  }, [shortcuts]);
  function point(e: PointerEvent<HTMLElement>) {
    if (
      gesture.current.origin &&
      e.buttons &&
      passedDragThreshold(gesture.current.origin, {
        x: e.clientX,
        y: e.clientY,
      })
    )
      gesture.current.dragged = true;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty(
      "--look-x",
      String(((e.clientX - r.left) / r.width) * 2 - 1),
    );
    e.currentTarget.style.setProperty(
      "--look-y",
      String(((e.clientY - r.top) / r.height) * 2 - 1),
    );
  }
  return (
    <section
      ref={ref}
      className={"identity-expanded " + (closing ? "identity-leaving" : "")}
      role="dialog"
      aria-modal="true"
      aria-label={profile.name + "’s interactive introduction"}
      tabIndex={-1}
      onPointerDown={(e) => {
        gesture.current = {
          origin: { x: e.clientX, y: e.clientY },
          dragged: false,
        };
      }}
      onPointerMove={point}
      onPointerLeave={(e) => {
        e.currentTarget.style.setProperty("--look-x", "0");
        e.currentTarget.style.setProperty("--look-y", "0");
      }}
    >
      <div ref={scene} className="identity-scene">
        <IdentityArtwork profile={profile} />
        <button
          className="scene-return"
          aria-label="Return to the project board"
          onClick={(e) => {
            if (e.detail === 0 || !gesture.current.dragged) setClosing(true);
          }}
        />
        <CrtOptics />
      </div>
      <button
        className="help-sticker expanded-help"
        aria-label="Help: keys and gestures"
        onClick={onHelp}
      >
        <HelpBadge />
      </button>
      <button
        className="contact-sticker expanded-contact"
        aria-label="Contact Ayush"
        onClick={onContact}
      >
        <ContactBadge />
      </button>
      <button className="scene-back" onClick={() => setClosing(true)}>
        BACK TO BOARD ×
      </button>
    </section>
  );
}
