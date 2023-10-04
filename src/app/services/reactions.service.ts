import { Injectable } from '@angular/core';
import { CollectionReference, Timestamp } from 'firebase/firestore';
import { Observable, Subject, filter, map } from 'rxjs';
import { AuthService } from './auth.service';
import {
  Firestore,
  collection,
  doc,
  query,
  setDoc,
  where,
} from '@angular/fire/firestore';
import { sortedChanges } from 'rxfire/firestore';

export interface ReactionOption {
  id: string;
  svg: string;
  lottie: string;
  alt: string;
}

export interface Reaction {
  id: string;
  reactionId: string;
  userId: string;
  createdAt: Timestamp;
}

const createSvgUrl = (id: string) =>
  `https://fonts.gstatic.com/s/e/notoemoji/latest/${id}/emoji.svg`;
const createLottieUrl = (id: string) =>
  `https://fonts.gstatic.com/s/e/notoemoji/latest/${id}/lottie.json`;

const REACTIONS: Pick<ReactionOption, 'id' | 'alt'>[] = [
  {
    id: '1f604',
    alt: '😄',
  },
  {
    id: '1f389',
    alt: '🎉',
  },
  {
    id: '1f4b8',
    alt: '💸',
  },
  {
    id: '1f914',
    alt: '🤔',
  },
  {
    id: '1f625',
    alt: '😥',
  },
  {
    id: '1f44d',
    alt: '👍',
  },
  {
    id: '1f44e',
    alt: '👎',
  },
];

const REACTIONS_LIST: ReactionOption[] = REACTIONS.map((reaction) => ({
  ...reaction,
  svg: createSvgUrl(reaction.id),
  lottie: createLottieUrl(reaction.id),
}));

const REACTIONS_MAP: { [id: string]: ReactionOption } = REACTIONS_LIST.reduce(
  (acc, curr) => ({ ...acc, [curr.id]: curr }),
  {}
);

@Injectable({
  providedIn: 'root',
})
export class ReactionsService {
  reactionsList = REACTIONS_LIST;
  reactionsMap = REACTIONS_MAP;

  private reactions = new Subject<Reaction>();

  constructor(
    private readonly firestore: Firestore,
    private readonly authService: AuthService
  ) {}

  async sendReaction(reactionId: string, roomId: string) {
    const user = await this.authService.getUser();
    const reaction: Reaction = {
      id: this.createId(),
      reactionId,
      userId: user.uid,
      createdAt: Timestamp.now(),
    };

    return setDoc(
      doc(this.firestore, 'rooms', roomId, 'reactions', reaction.id),
      reaction
    );
  }

  getReactionsStream(roomId: string): Observable<Reaction> {
    const ref = collection(
      this.firestore,
      'rooms',
      roomId,
      'reactions'
    ) as CollectionReference<Reaction>;
    const q = query<Reaction>(ref, where('createdAt', '>=', Timestamp.now()));
    return sortedChanges(q, { events: ['added'] }).pipe(
      filter(changes => !!changes.length),
      map((documentChange) => documentChange.pop().doc.data())
    );
  }

  private createId() {
    return doc(collection(this.firestore, '_')).id;
  }
}
