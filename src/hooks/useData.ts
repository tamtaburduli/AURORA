import { useEffect, useState } from 'react';

const cache = new Map<string, Promise<unknown>>();

/** Resolve a path inside /public relative to the deployed base (works on GitHub Pages sub-paths). */
export function publicUrl(path: string): string {
  return `${import.meta.env.BASE_URL}${path.replace(/^\//, '')}`;
}

function load<T>(file: string): Promise<T> {
  if (!cache.has(file)) {
    cache.set(
      file,
      fetch(publicUrl(`data/${file}`)).then((r) => {
        if (!r.ok) throw new Error(`Could not load data/${file} (${r.status})`);
        return r.json();
      }),
    );
  }
  return cache.get(file) as Promise<T>;
}

/** Loads a JSON file from public/data. Research content lives there so it can be edited without touching components. */
export function useData<T>(file: string): { data: T | null; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    load<T>(file)
      .then((d) => alive && setData(d))
      .catch((e: Error) => alive && setError(e.message));
    return () => {
      alive = false;
    };
  }, [file]);
  return { data, error };
}

/** Checks whether an optional file (e.g. a manuscript PDF) exists before showing its button. */
export function useFileExists(path: string | null | undefined): boolean {
  const [exists, setExists] = useState(false);
  useEffect(() => {
    if (!path) return setExists(false);
    let alive = true;
    fetch(publicUrl(path), { method: 'HEAD' })
      .then((r) => alive && setExists(r.ok))
      .catch(() => alive && setExists(false));
    return () => {
      alive = false;
    };
  }, [path]);
  return exists;
}
