import { useEffect, useState } from "react";
export function useResource<T>(
  loader: (signal: AbortSignal) => Promise<T>,
  key: string,
) {
  const [state, setState] = useState<{
    data?: T;
    error?: string;
    loading: boolean;
  }>({ loading: true });
  const [attempt, retry] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setState({ loading: true });
    loader(controller.signal)
      .then((data) => setState({ data, loading: false }))
      .catch((error) => {
        if (!controller.signal.aborted)
          setState({ loading: false, error: error.message });
      });
    return () => controller.abort();
    // The key declares the loader identity; retries always use the current loader.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt]);
  return { ...state, retry: () => retry((n) => n + 1) };
}
