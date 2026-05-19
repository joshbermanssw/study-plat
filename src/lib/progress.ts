"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export interface NoteProgress {
  read: boolean;
  confidence: number; // 0..5
  lastSeen?: string;
}

export interface ProgressState {
  notes: Record<string, NoteProgress>;
  streak: { lastStudyDate?: string; currentStreak: number };
  pinned: string[];
  version: 1;
}

const KEY = "study-platform/progress/v1";

const empty: ProgressState = { notes: {}, streak: { currentStreak: 0 }, pinned: [], version: 1 };

const listeners = new Set<() => void>();
let cache: ProgressState | null = null;

function read(): ProgressState {
  if (typeof window === "undefined") return empty;
  if (cache) return cache;
  try {
    const raw = window.localStorage.getItem(KEY);
    cache = raw ? { ...empty, ...(JSON.parse(raw) as ProgressState) } : { ...empty };
  } catch {
    cache = { ...empty };
  }
  return cache!;
}

function write(next: ProgressState) {
  cache = next;
  try { window.localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, read, () => empty);
}

export function useNoteProgress(slug: string): NoteProgress {
  const all = useProgress();
  return all.notes[slug] ?? { read: false, confidence: 0 };
}

function bumpStreak(state: ProgressState): ProgressState["streak"] {
  const today = new Date().toISOString().slice(0, 10);
  const last = state.streak.lastStudyDate;
  if (last === today) return state.streak;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const currentStreak = last === yesterday ? state.streak.currentStreak + 1 : 1;
  return { lastStudyDate: today, currentStreak };
}

export function setRead(slug: string, isRead: boolean) {
  const s = readState();
  const prev = s.notes[slug] ?? { read: false, confidence: 0 };
  write({
    ...s,
    notes: { ...s.notes, [slug]: { ...prev, read: isRead, lastSeen: new Date().toISOString() } },
    streak: isRead ? bumpStreak(s) : s.streak,
  });
}

export function setConfidence(slug: string, confidence: number) {
  const s = readState();
  const prev = s.notes[slug] ?? { read: false, confidence: 0 };
  const c = Math.max(0, Math.min(5, Math.round(confidence)));
  write({
    ...s,
    notes: { ...s.notes, [slug]: { ...prev, confidence: c, lastSeen: new Date().toISOString() } },
    streak: bumpStreak(s),
  });
}

export function togglePin(slug: string) {
  const s = readState();
  const has = s.pinned.includes(slug);
  write({ ...s, pinned: has ? s.pinned.filter((x) => x !== slug) : [...s.pinned, slug] });
}

export function exportState(): string {
  return JSON.stringify(readState(), null, 2);
}

export function importState(json: string) {
  try {
    const parsed = JSON.parse(json) as ProgressState;
    write({ ...empty, ...parsed });
  } catch {}
}

function readState(): ProgressState {
  return read();
}

/** Rolled-up percentage of notes marked read, in [0..1]. */
export function readPercent(state: ProgressState, slugs: string[]): number {
  if (!slugs.length) return 0;
  const done = slugs.filter((s) => state.notes[s]?.read).length;
  return done / slugs.length;
}

/** Mean confidence in [0..5]. */
export function meanConfidence(state: ProgressState, slugs: string[]): number {
  if (!slugs.length) return 0;
  const sum = slugs.reduce((acc, s) => acc + (state.notes[s]?.confidence ?? 0), 0);
  return sum / slugs.length;
}

/** Hydration-safe accessor for SSR — falls back to empty until mounted. */
export function useMountedProgress(): ProgressState {
  const [mounted, setMounted] = useState(false);
  const state = useProgress();
  useEffect(() => setMounted(true), []);
  return mounted ? state : empty;
}
