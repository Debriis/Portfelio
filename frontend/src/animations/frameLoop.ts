type Task = { run: (time: number) => boolean; priority: number };
const tasks = new Set<Task>();
let frame = 0,
  listening = false;
function wake() {
  if (!frame && tasks.size && !document.hidden)
    frame = requestAnimationFrame(tick);
}
function visibility() {
  if (document.hidden) {
    cancelAnimationFrame(frame);
    frame = 0;
  } else wake();
}
function detach() {
  if (!tasks.size && listening) {
    document.removeEventListener("visibilitychange", visibility);
    listening = false;
    cancelAnimationFrame(frame);
    frame = 0;
  }
}
function tick(time: number) {
  frame = 0;
  // Camera writes precede GPU reads, so dragging never adds a frame of latency.
  for (const task of [...tasks].sort((a, b) => a.priority - b.priority))
    if (tasks.has(task) && !task.run(time)) tasks.delete(task);
  detach();
  wake();
}
export function requestFrames(run: Task["run"], priority = 0) {
  const task = { run, priority };
  tasks.add(task);
  if (!listening) {
    document.addEventListener("visibilitychange", visibility);
    listening = true;
  }
  wake();
  return () => {
    tasks.delete(task);
    detach();
  };
}
