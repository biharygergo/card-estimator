import { Timestamp } from 'firebase/firestore';
import { timer } from 'rxjs';
import { Round } from './types';

export const getHumanReadableElapsedTime = (round: Round) => {
  let elapsed = 'Not finished';
  if (!!round.started_at && !!round.finished_at) {
    const finishedAt = round.finished_at as Timestamp;
    const startAt = round.started_at as Timestamp;
    const diff = finishedAt.seconds - startAt.seconds;
    const minutes = Math.floor(diff / 60);
    const seconds = diff - minutes * 60;
    elapsed = `${minutes}m ${seconds}s`;
  }
  return elapsed;
};

export const createTimer = (minutes: number) => {
  return timer(1000 * 60 * minutes);
};

export const isRunningInZoom = () => {
  return (
    typeof window !== 'undefined' &&
    window.navigator.userAgent.includes('ZoomWebKit')
  );
};

export const createHash = (str: string, seed = 0): string => {
  let h1 = 0xdeadbeef ^ seed,
    h2 = 0x41c6ce57 ^ seed;
  for (let i = 0, ch; i < str.length; i++) {
    ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 =
    Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
    Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 =
    Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
    Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString();
};
