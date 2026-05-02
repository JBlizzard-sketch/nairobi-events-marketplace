import { useState, useCallback } from "react";

const STORAGE_KEY = "nairobi_saved_vendors_v1";

function readIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeIds(ids: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    // ignore storage errors
  }
}

export function useSavedVendors() {
  const [savedIds, setSavedIds] = useState<string[]>(readIds);

  const toggle = useCallback((id: string) => {
    setSavedIds(prev => {
      const next = prev.includes(id)
        ? prev.filter(x => x !== id)
        : [...prev, id];
      writeIds(next);
      return next;
    });
  }, []);

  const isSaved = useCallback((id: string) => savedIds.includes(id), [savedIds]);

  return { savedIds, toggle, isSaved, count: savedIds.length };
}
