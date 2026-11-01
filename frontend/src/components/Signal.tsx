export function Signal({
  error,
  empty,
  retry,
}: {
  error?: string;
  empty?: boolean;
  retry?: () => void;
}) {
  return (
    <div className="signal" role={error ? "alert" : "status"}>
      <span className="signal-icon">{error ? "↯" : empty ? "◌" : "✳"}</span>
      <h2>{error ? "NO SIGNAL" : empty ? "STAY TUNED" : "TUNING IN"}</h2>
      <p>
        {error ||
          (empty
            ? "New channels are on their way."
            : "Connecting to Ayush’s world…")}
      </p>
      {error && <button onClick={retry}>↻ Retry connection</button>}
    </div>
  );
}
