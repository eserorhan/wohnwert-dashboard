"use client";
import { useState, useEffect, useCallback } from "react";

const KEY = "ww_favorites";

function load(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    return new Set();
  }
}

function save(s: Set<number>) {
  localStorage.setItem(KEY, JSON.stringify([...s]));
}

export function useFavorites() {
  const [favs, setFavs] = useState<Set<number>>(new Set());

  useEffect(() => {
    setFavs(load());
  }, []);

  const toggle = useCallback((id: number) => {
    setFavs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      save(next);
      return next;
    });
  }, []);

  const isFav = useCallback((id: number) => favs.has(id), [favs]);

  return { favs, toggle, isFav, count: favs.size };
}
