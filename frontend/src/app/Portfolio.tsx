"use client";
import { useEffect, useRef, useState } from "react";
import type { Project } from "../../../shared/types";
import { api } from "../services/api";
import { useResource } from "../hooks/useResource";
import { useCursorDrift } from "../hooks/useCursorDrift";
import { Signal } from "../components/Signal";
import { Board } from "../features/board/Board";
import { ProjectView } from "../features/projects/ProjectView";
import { Help } from "../features/help/Help";
import { motion } from "../animations/settings";
import { IdentityView } from "../features/television/IdentityView";
import { CrtOptics } from "../features/television/CrtOptics";
import type { ArtworkOrigin } from "../features/television/Identity";
import { HelpBadge, ContactBadge } from "../features/television/Stickers";
import { IntroStartup } from "../features/television/IntroStartup";
import { CrtDefinitions } from "../features/television/CrtDefinitions";
import "../styles/reference.css";
function preference() {
  try {
    return localStorage.getItem("ayush-shortcuts") !== "off";
  } catch {
    return true;
  }
}
export default function Portfolio() {
  const resource = useResource(async (signal) => {
    const [profile, projects] = await Promise.all([
      api.profile(signal),
      api.projects(signal),
    ]);
    return {
      profile,
      projects: projects.sort((a, b) => a.channel - b.channel),
    };
  }, "portfolio");
  useEffect(() => setShortcuts(preference()), []);
  const [active, setActive] = useState<string | null>(null),
    [help, setHelp] = useState(false),
    [contact, setContact] = useState(false);
  const [identity, setIdentity] = useState<ArtworkOrigin | null>(null);
  const [shortcuts, setShortcuts] = useState(true),
    [reset, setReset] = useState(0),
    [pan, setPan] = useState({ x: 0, y: 0 }),
    [zoom, setZoom] = useState({ factor: 1, key: 0 });
  const [startup, setStartup] = useState(true),
    [transition, setTransition] = useState(0);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const data = resource.data;
  const picture = useCursorDrift(
    !!data && !startup && !identity && !active && !help && !contact,
  );
  const returnFocus = useRef<HTMLElement | null>(null);
  const restorePending = useRef(false);
  useEffect(() => {
    if (identity || active || help || contact || !restorePending.current)
      return;
    // Restore after React removes inert and the overlay's focus cleanup completes.
    const frame = requestAnimationFrame(() => {
      restorePending.current = false;
      if (returnFocus.current?.isConnected)
        returnFocus.current.focus({ preventScroll: true });
    });
    return () => cancelAnimationFrame(frame);
  }, [identity, active, help, contact]);
  useEffect(
    () => () => {
      if (transitionTimer.current) clearTimeout(transitionTimer.current);
    },
    [],
  );
  useEffect(() => {
    const handle = () =>
      document.documentElement.classList.toggle("page-hidden", document.hidden);
    document.addEventListener("visibilitychange", handle);
    return () => document.removeEventListener("visibilitychange", handle);
  }, []);
  function burst() {
    setTransition((n) => n + 1);
    if (transitionTimer.current) clearTimeout(transitionTimer.current);
    transitionTimer.current = setTimeout(
      () => setTransition(0),
      motion.channelMs,
    );
  }
  function rememberFocus() {
    if (!active && !help && !contact && !identity)
      returnFocus.current = document.activeElement as HTMLElement;
  }
  function openIdentity(origin: ArtworkOrigin) {
    rememberFocus();
    setIdentity(origin);
  }
  function closeIdentity() {
    restorePending.current = true;
    setIdentity(null);
  }
  function open(p: Project) {
    rememberFocus();
    setHelp(false);
    setContact(false);
    setActive(p.id);
    burst();
  }
  function close() {
    restorePending.current = true;
    setHelp(false);
    setActive(null);
    setContact(false);
    burst();
  }
  function goHome() {
    returnFocus.current = null;
    close();
    setReset((n) => n + 1);
    requestAnimationFrame(() =>
      document
        .querySelector<HTMLElement>(".board")
        ?.focus({ preventScroll: true }),
    );
  }
  function navigate(delta: number) {
    if (!data?.projects.length) return;
    const index = data.projects.findIndex((p) => p.id === active);
    open(
      data.projects[
        index < 0
          ? delta > 0
            ? 0
            : data.projects.length - 1
          : (index + delta + data.projects.length) % data.projects.length
      ],
    );
  }
  function toggle() {
    setShortcuts((v) => {
      try {
        localStorage.setItem("ayush-shortcuts", v ? "off" : "on");
      } catch {
        /* Preference remains usable when storage is blocked. */
      }
      return !v;
    });
  }
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        e.ctrlKey ||
        e.metaKey ||
        e.altKey ||
        (e.target instanceof HTMLElement &&
          e.target.closest('input,textarea,select,[contenteditable="true"]'))
      )
        return;
      if (identity) {
        if (!shortcuts) return;
        if (e.key.startsWith("Arrow")) {
          setIdentity(null);
          navigate(e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 1);
          e.preventDefault();
          return;
        }
        const channel =
          /^[1-9]$/.test(e.key) &&
          data?.projects.some((p) => p.channel === Number(e.key));
        if (
          !["?", "Home", "PageUp", "PageDown", "r", "R"].includes(e.key) &&
          !channel
        )
          return;
        setIdentity(null);
      }
      const k = e.key;
      let handled = true;
      if (k === "Escape" && (active || help || contact)) close();
      else if (!shortcuts || !data) return;
      else if (k === "?") {
        rememberFocus();
        setHelp((v) => !v);
        setContact(false);
        burst();
      } else if (k === "Home") goHome();
      else if (k === "Backspace" && (active || help || contact)) close();
      else if (k === "PageDown") navigate(1);
      else if (k === "PageUp") navigate(-1);
      else if (k.toLowerCase() === "r" && data.projects.length)
        open(data.projects[Math.floor(Math.random() * data.projects.length)]);
      else if (/^[1-9]$/.test(k)) {
        const p = data.projects.find((p) => p.channel === Number(k));
        if (p) open(p);
        else handled = false;
      } else if (k.startsWith("Arrow") && !help && !contact) {
        if (active) navigate(k === "ArrowLeft" || k === "ArrowUp" ? -1 : 1);
        else
          setPan({
            x: k === "ArrowLeft" ? 85 : k === "ArrowRight" ? -85 : 0,
            y: k === "ArrowUp" ? 85 : k === "ArrowDown" ? -85 : 0,
          });
      } else if ((k === "+" || k === "=" || k === "-") && !active && !help)
        setZoom((v) => ({ factor: k === "-" ? 0.85 : 1.18, key: v.key + 1 }));
      else if (
        k === " " &&
        (active || help) &&
        !(e.target instanceof HTMLElement && e.target.closest("button,a"))
      )
        close();
      else if (
        (k === "Enter" || k === " ") &&
        !active &&
        !help &&
        !contact &&
        !(e.target instanceof HTMLElement && e.target.closest("button,a")) &&
        data.projects.length
      )
        open(data.projects[0]);
      else handled = false;
      if (handled) e.preventDefault();
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  });
  return (
    <>
      <CrtDefinitions />
      <main className="portfolio" inert={!!identity}>
        <div className="outer-label">
          <span>AYUSH® — CREATIVE DEVELOPER</span>
          <span>AN INTERACTIVE PORTFOLIO</span>
        </div>
        <div
          className={`television ${startup ? "starting" : ""}`}
        >
          <div className="crt-screen">
            <div ref={picture} className="crt-picture">
              <div className="screen-status" aria-hidden="true">
                <span>
                  AV—01 <i /> LIVE
                </span>
                <span>
                  {help
                    ? "000 / HELP"
                    : active
                      ? `CH ${String(data?.projects.find((p) => p.id === active)?.channel || 0).padStart(3, "0")}`
                      : "AYUSH BROADCAST SYSTEM"}
                </span>
                <span>STEREO ◫</span>
              </div>
              {resource.loading || resource.error ? (
                <Signal error={resource.error} retry={resource.retry} />
              ) : (
                data &&
                (!data.projects.length ? (
                  <Signal empty />
                ) : (
                  <div inert={!!active || help || contact}>
                    <Board
                      projects={data.projects}
                      profile={data.profile}
                      open={open}
                      openIdentity={openIdentity}
                      resetKey={reset}
                      pan={pan}
                      zoomCommand={zoom}
                    />
                  </div>
                ))
              )}
              {active && !help && !contact && (
                <ProjectView id={active} close={close} navigate={navigate} />
              )}
              {help && data && (
                <Help
                  profile={data.profile}
                  reset={goHome}
                  shortcuts={shortcuts}
                  toggle={toggle}
                  close={close}
                />
              )}
              {contact && data && (
                <Contact profile={data.profile} close={close} />
              )}
            </div>
            <CrtOptics />
            {startup && data && (
              <IntroStartup
                profile={data.profile}
                complete={() => setStartup(false)}
              />
            )}
            {!!transition && (
              <div
                key={transition}
                className="channel-static"
                aria-hidden="true"
              />
            )}
          </div>
          <button
            className="help-sticker"
            disabled={!data}
            aria-label={help ? "Close help" : "Help: keys and gestures"}
            onClick={() => {
              if (help) close();
              else {
                rememberFocus();
                setHelp(true);
                setContact(false);
                burst();
              }
            }}
          >
            <HelpBadge />
          </button>
          <button
            className="contact-sticker"
            disabled={!data}
            onClick={() => {
              rememberFocus();
              setContact(true);
              setHelp(false);
              burst();
            }}
            aria-label="Contact Ayush"
          >
            <ContactBadge />
          </button>
        </div>
        <footer className="console">
          <div className="console-instructions">
            <span className="power-light" /> EXPLORE AT YOUR OWN FREQUENCY
          </div>
          <div className="console-controls">
            <button onClick={goHome} aria-label="Home: reset board">
              ⌂ <span>HOME</span>
            </button>
            <button
              disabled={!data?.projects.length}
              onClick={() => navigate(-1)}
              aria-label="Previous channel"
            >
              ←
            </button>
            <span className="channel-label">CH</span>
            <button
              disabled={!data?.projects.length}
              onClick={() => navigate(1)}
              aria-label="Next channel"
            >
              →
            </button>
            <button
              role="switch"
              aria-checked={shortcuts}
              onClick={toggle}
              aria-label="Single-key shortcuts"
            >
              ⌨ <span>{shortcuts ? "ON" : "OFF"}</span>
            </button>
          </div>
        </footer>
        <div className="sr-only" aria-live="polite">
          {active
            ? `Channel ${data?.projects.find((p) => p.id === active)?.channel}`
            : help
              ? "Help screen"
              : "Project board"}
        </div>
      </main>
      {identity && data && (
        <IdentityView
          profile={data.profile}
          origin={identity}
          shortcuts={shortcuts}
          onClose={closeIdentity}
          onHelp={() => {
            setIdentity(null);
            setHelp(true);
            burst();
          }}
          onContact={() => {
            setIdentity(null);
            setContact(true);
            burst();
          }}
        />
      )}
    </>
  );
}
import type { Profile } from "../../../shared/types";
import { safeUrl } from "../services/api";
import { useDialogFocus } from "../hooks/useDialogFocus";
function Contact({ profile, close }: { profile: Profile; close: () => void }) {
  const ref = useDialogFocus();
  return (
    <section
      className="teletext contact-view"
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label="Contact Ayush"
    >
      <div className="teletext-header">
        <span>HELLO, WORLD.</span>
        <button onClick={close}>CLOSE ×</button>
      </div>
      <div className="contact-content">
        <span className="contact-star" aria-hidden="true">
          ✳
        </span>
        <h1>
          LET’S MAKE
          <br />
          SOMETHING GOOD.
        </h1>
        {profile.availability && <p>{profile.availability}</p>}
        {profile.email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email) && (
          <a href={`mailto:${profile.email}`}>{profile.email} ↗</a>
        )}
        {profile.socials
          .filter((s) => safeUrl(s.url))
          .map((s) => (
            <a key={s.label} href={s.url} target="_blank" rel="noreferrer">
              {s.label} ↗
            </a>
          ))}
        {!profile.email && !profile.socials.some((s) => safeUrl(s.url)) && (
          <p>
            Contact details are coming soon.
            <br />
            For now, enjoy exploring.
          </p>
        )}
        <button onClick={close}>BACK TO EXPLORING ↗</button>
      </div>
    </section>
  );
}
