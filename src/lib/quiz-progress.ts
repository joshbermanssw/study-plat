"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

export interface QuizAttempt {
  timestamp: string;       // ISO
  answers: Record<string, number>;  // questionId → chosen choice index
  score: number;
  total: number;
}

export interface QuizState {
  attempts: QuizAttempt[];
}

const empty: QuizState = { attempts: [] };

function key(unit: string, week: number): string {
  return `study-platform/quiz/${unit}/${week}`;
}

const listeners = new Map<string, Set<() => void>>();
const cache = new Map<string, QuizState>();

function read(k: string): QuizState {
  if (typeof window === "undefined") return empty;
  if (cache.has(k)) return cache.get(k)!;
  try {
    const raw = window.localStorage.getItem(k);
    const state: QuizState = raw ? JSON.parse(raw) : { ...empty };
    cache.set(k, state);
    return state;
  } catch {
    return { ...empty };
  }
}

function write(k: string, state: QuizState) {
  cache.set(k, state);
  try { window.localStorage.setItem(k, JSON.stringify(state)); } catch {}
  listeners.get(k)?.forEach((l) => l());
}

function subscribe(k: string, cb: () => void) {
  if (!listeners.has(k)) listeners.set(k, new Set());
  listeners.get(k)!.add(cb);
  return () => listeners.get(k)?.delete(cb);
}

export function useQuizState(unit: string, week: number): QuizState {
  const k = key(unit, week);
  const state = useSyncExternalStore(
    (cb) => subscribe(k, cb),
    () => read(k),
    () => empty,
  );
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted ? state : empty;
}

export function recordAttempt(unit: string, week: number, attempt: QuizAttempt) {
  const k = key(unit, week);
  const state = read(k);
  write(k, { ...state, attempts: [...state.attempts, attempt] });
}

export function bestScore(state: QuizState): QuizAttempt | undefined {
  if (state.attempts.length === 0) return undefined;
  return state.attempts.reduce((best, a) =>
    a.score / a.total > best.score / best.total ? a : best,
  state.attempts[0]);
}
