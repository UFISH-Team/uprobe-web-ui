import { useState, Dispatch, SetStateAction } from 'react';
const drafts = new Map<string, unknown>();
export function useDraftState<T>(name: string, initial: T): [T, Dispatch<SetStateAction<T>>] {
  const identity = sessionStorage.getItem('token') || localStorage.getItem('token') || 'anonymous';
  const key = `${identity}:${name}`;
  const [value, update] = useState<T>(() => drafts.has(key) ? drafts.get(key) as T : initial);
  const set: Dispatch<SetStateAction<T>> = next => update(previous => {
    const resolved = typeof next === 'function' ? (next as (value:T)=>T)(previous) : next;
    drafts.set(key,resolved); return resolved;
  });
  return [value,set];
}
