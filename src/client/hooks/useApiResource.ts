import { useEffect, useState } from 'react';
import type { DependencyList } from 'react';

const resourceCache = new Map<string, unknown>();

export interface AsyncResource<T> {
  data: T;
  loading: boolean;
  error: string | null;
}

/**
 * Loads a value from the API and tracks its loading and error state, re-running
 * whenever `deps` change.
 *
 * This replaces hand-rolled useState/useEffect trios per endpoint. Beyond the
 * duplication, those had a real defect this fixes: when a filter changed faster
 * than a request completed, an earlier response could resolve last and overwrite
 * the newer data. The `active` flag makes every superseded request a no-op, so
 * only the most recent one is allowed to publish.
 *
 * @param load     Fetches the value. Must reflect the current `deps`.
 * @param fallback Value shown before the first success and after a failure.
 * @param deps     Re-fetch trigger, same semantics as a useEffect dependency list.
 */
export function useApiResource<T>(
  load: () => Promise<T>,
  fallback: T,
  deps: DependencyList,
  cacheKey?: string,
  enabled = true
): AsyncResource<T> {
  const [state, setState] = useState<AsyncResource<T>>({
    data: fallback,
    loading: true,
    error: null,
  });

  useEffect(() => {
    let active = true;

    if (!enabled) {
      setState({ data: fallback, loading: false, error: null });
      return () => {
        active = false;
      };
    }

    if (cacheKey && resourceCache.has(cacheKey)) {
      setState({
        data: resourceCache.get(cacheKey) as T,
        loading: false,
        error: null,
      });
      return () => {
        active = false;
      };
    }

    // Keep the previous data visible while refetching, so changing a filter
    // does not blank the table it is filtering.
    setState(previous => ({ ...previous, loading: true, error: null }));

    load()
      .then(data => {
        if (!active) return;
        if (cacheKey) resourceCache.set(cacheKey, data);
        setState({ data, loading: false, error: null });
      })
      .catch((cause: unknown) => {
        if (!active) return;
        setState({
          data: fallback,
          loading: false,
          error: cause instanceof Error ? cause.message : 'Request failed',
        });
      });

    return () => {
      active = false;
    };
    // `load` and `fallback` are intentionally excluded: callers pass inline
    // closures and literals, so including them would refetch on every render.
    // `deps` is the caller's explicit statement of what the request depends on.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, cacheKey, enabled]);

  return state;
}
