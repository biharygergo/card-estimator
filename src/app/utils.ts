import { Timestamp } from "firebase/firestore";
import { timer } from "rxjs";
import { Round } from "./types";

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
    return elapsed
}

export const createTimer = (minutes: number) => {
    return timer(1000 * 60 * minutes);
}