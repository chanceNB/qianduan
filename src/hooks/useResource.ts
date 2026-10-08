import { useEffect, useState, useCallback, useRef } from "react";
export function useResource<T>(
  loader: () => Promise<T>,
  deps: readonly unknown[],
) {
  const [state, setState] = useState<{
    data: T | null;
    error: unknown;
    loading: boolean;
    key: string;
  }>({ data: null, error: null, loading: true, key: "" });
  const [revision, setRevision] = useState(0);
  const loaderRef = useRef(loader);
  const key = JSON.stringify([deps, revision]);
  useEffect(() => {
    loaderRef.current = loader;
  });
  useEffect(() => {
    let active = true;
    setState({ data: null, error: null, loading: true, key });
    loaderRef.current().then(
      (data) => {
        if (active) setState({ data, error: null, loading: false, key });
      },
      (error) => {
        if (active) setState({ data: null, error, loading: false, key });
      },
    );
    return () => {
      active = false;
    };
  }, [key, revision]);
  return {
    ...(state.key === key ? state : { data: null, error: null, loading: true }),
    reload: useCallback(() => setRevision((x) => x + 1), []),
  };
}
