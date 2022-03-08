import { Round } from "./types";

export const getHumanReadableElapsedTime = (round: Round) => {
    let elapsed = 'Not finished';
    if (!!round.started_at && !!round.finished_at) {
        const diff = round.finished_at.seconds - round.started_at.seconds;
        const minutes = Math.floor(diff / 60);
        const seconds = diff - minutes * 60;
        elapsed = `${minutes}m ${seconds}s`;
    }
    return elapsed
}