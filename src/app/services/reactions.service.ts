import { Injectable } from '@angular/core';
import { CollectionReference, FieldValue, Timestamp } from 'firebase/firestore';
import { Observable, Subject, map, skip, tap } from 'rxjs';
import { AuthService } from './auth.service';
import {
  Firestore,
  collection,
  collectionChanges,
  doc,
  limit,
  query,
  setDoc,
} from '@angular/fire/firestore';
import { sortedChanges } from 'rxfire/firestore';

export interface ReactionOption {
  id: string;
  webp: string;
  gif: string;
  svg: string;
  alt: string;
}

export interface Reaction {
  id: string;
  reactionId: string;
  userId: string;
  createdAt: Timestamp;
}

const createWebpUrl = (id: string) =>
  `https://fonts.gstatic.com/s/e/notoemoji/latest/${id}/512.webp`;
const createGifUrl = (id: string) =>
  `https://fonts.gstatic.com/s/e/notoemoji/latest/${id}/512.gif`;
const createSvgUrl = (id: string) =>
  `https://fonts.gstatic.com/s/e/notoemoji/latest/${id}/emoji.svg`;

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
  webp: createWebpUrl(reaction.id),
  gif: createGifUrl(reaction.id),
  svg: createSvgUrl(reaction.id),
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
    const q = query<Reaction>(ref);
    return collectionChanges(q, { events: ['added'] }).pipe(
      skip(1),
      map((documentChange) => documentChange.pop().doc.data())
    );
  }

  private createId() {
    return doc(collection(this.firestore, '_')).id;
  }
}
