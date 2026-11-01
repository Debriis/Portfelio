import { useEffect } from "react";
import type { Profile, Project } from "../../../../shared/types";
import { useBoard } from "./useBoard";
import { Identity, type ArtworkOrigin } from "../television/Identity";
export function Board({
  projects,
  profile,
  open,
  openIdentity,
  resetKey,
  pan,
  zoomCommand,
}: {
  projects: Project[];
  profile: Profile;
  open: (p: Project) => void;
  openIdentity: (origin: ArtworkOrigin) => void;
  resetKey: number;
  pan: { x: number; y: number };
  zoomCommand: { factor: number; key: number };
}) {
  const board = useBoard(resetKey);
  useEffect(() => {
    board.setView((v) => ({ ...v, x: v.x + pan.x, y: v.y + pan.y }));
  }, [pan]);
  useEffect(() => {
    if (zoomCommand.key) board.zoom(zoomCommand.factor);
  }, [zoomCommand]);
  return (
    <div
      className="board"
      tabIndex={-1}
      ref={board.element}
      {...board.handlers}
      aria-label="Draggable project board"
    >
      <div
        className="board-world"
      >
        <Identity
          profile={profile}
          open={(origin, keyboard) => {
            if (!board.dragged.current || keyboard) openIdentity(origin);
          }}
        />
        {projects.map((p, i) => (
          <button
            key={p.id}
            className={
              "project-card preview-" + (p.boardPreview?.shape || "image")
            }
            style={{left:p.position.x/19.2+'vw',top:p.position.y/19.2+'vw',width:(p.boardPreview?.width||300)/19.2+'vw',height:(p.boardPreview?.height||210)/19.2+'vw',...{'--rotation':p.position.rotation+'deg','--accent':p.accent,'--delay':i*90+'ms'}}}
            onClick={(e) => {
              if (board.dragged.current && e.detail !== 0) {
                e.preventDefault();
                return;
              }
              open(p);
            }}
            onFocus={(e) => {
              if (e.currentTarget.matches(":focus-visible")) {
                const card = e.currentTarget.getBoundingClientRect(),
                  frame = board.element.current!.getBoundingClientRect();
                const x = card.x + card.width / 2,
                  y = card.y + card.height / 2;
                if (
                  x < frame.left + 40 ||
                  x > frame.right - 40 ||
                  y < frame.top + 40 ||
                  y > frame.bottom - 40
                )
                  board.setView((v) => ({
                    ...v,
                    x: ((-p.position.x * window.innerWidth) / 1920) * v.scale,
                    y: ((-p.position.y * window.innerWidth) / 1920) * v.scale,
                  }));
              }
            }}
            aria-label={`Open channel ${p.channel}: ${p.title}`}
          >
            <span className="card-channel">
              CH {String(p.channel).padStart(3, "0")} <span>↗</span>
            </span>
            <img
              src={p.boardPreview?.src || p.thumbnail.src}
              alt={p.boardPreview?.alt || p.thumbnail.alt}
              draggable="false"
            />
            <span className="card-caption">
              <strong>{p.title}</strong>
              <span>{p.category}</span>
            </span>
            <span className="sample-label">SAMPLE / COMING SOON</span>
          </button>
        ))}
        <div
          className="ticker board-broadcast"
          aria-label="Ayush makes games, websites and mobile apps"
        >
          <span className="ticker-tag">NEW!</span>
          <div className="ticker-window">
            <div className="ticker-track" aria-hidden="true">
              HEY, I’M AYUSH. I MAKE GAMES, WEBSITES, AND MOBILE APPS. ✳ HEY,
              I’M AYUSH. I MAKE GAMES, WEBSITES, AND MOBILE APPS. ✳{" "}
            </div>
          </div>
        </div>
        <div className="board-scribble" aria-hidden="true">
          a little bit
          <br />
          of everything. <span>↗</span>
        </div>
      </div>
      <div className="board-hint" aria-hidden="true">
        ↔ DRAG TO EXPLORE <i /> SCROLL TO ZOOM
      </div>
      <output className="zoom-readout" aria-label="Board zoom">
        {Math.round(board.view.scale * 100)}%
      </output>
    </div>
  );
}
