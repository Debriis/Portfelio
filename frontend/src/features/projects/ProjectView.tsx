import { api, safeUrl } from "../../services/api";
import { useResource } from "../../hooks/useResource";
import { useDialogFocus } from "../../hooks/useDialogFocus";
import { Signal } from "../../components/Signal";
export function ProjectView({
  id,
  close,
  navigate,
}: {
  id: string;
  close: () => void;
  navigate: (delta: number) => void;
}) {
  const resource = useResource((signal) => api.project(id, signal), id);
  const ref = useDialogFocus();
  const p = resource.data;
  return (
    <section
      ref={ref}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-label={p?.title || "Project channel"}
      className="teletext project-view"
    >
      <div className="teletext-header">
        <span>AYUSH / CH {p ? String(p.channel).padStart(3, "0") : "---"}</span>
        <span>PROJECT TRANSMISSION</span>
        <button onClick={close} aria-label="Close project">
          CLOSE ×
        </button>
      </div>
      {resource.loading || resource.error ? (
        <Signal error={resource.error} retry={resource.retry} />
      ) : (
        p && (
          <div className="project-scroll" key={id}>
            <div className="project-category">
              {p.category} <span>● SAMPLE CHANNEL</span>
            </div>
            <img
              className="project-hero"
              src={p.thumbnail.src}
              alt={p.thumbnail.alt}
            />
            <h1>{p.title}</h1>
            <p className="project-description">{p.description}</p>
            {p.sample && (
              <p className="sample-notice">
                Sample project — details coming soon.
              </p>
            )}
            {!!p.technologies.length && (
              <ul className="technologies" aria-label="Technologies">
                {p.technologies.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}
            <div className="project-links">
              {safeUrl(p.liveUrl) && (
                <a href={p.liveUrl} target="_blank" rel="noreferrer">
                  Live project ↗
                </a>
              )}
              {safeUrl(p.sourceUrl) && (
                <a href={p.sourceUrl} target="_blank" rel="noreferrer">
                  Source code ↗
                </a>
              )}
            </div>
            {p.images.map((img) => (
              <img
                className="detail-image"
                key={img.src}
                src={img.src}
                alt={img.alt}
                loading="lazy"
              />
            ))}
            {safeUrl(p.video) || p.video?.startsWith("/assets/") ? (
              <video
                controls
                preload="none"
                src={p.video}
                aria-label={`${p.title} video`}
              />
            ) : null}
          </div>
        )
      )}
      <div className="project-navigation">
        <button onClick={() => navigate(-1)}>← PREVIOUS</button>
        <span>CHANGE THE CHANNEL</span>
        <button onClick={() => navigate(1)}>NEXT →</button>
      </div>
    </section>
  );
}
