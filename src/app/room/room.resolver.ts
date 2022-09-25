import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  Router,
  Resolve,
  RouterStateSnapshot,
  ActivatedRouteSnapshot,
} from '@angular/router';
import { catchError, map, mergeMap, Observable, of, take, tap } from 'rxjs';
import { AuthService } from '../services/auth.service';
import {
  EstimatorService,
  MemberNotFoundError,
  NotLoggedInError,
  RoomNotFoundError,
} from '../services/estimator.service';
import { Room } from '../types';

@Injectable({
  providedIn: 'root',
})
export class RoomResolver implements Resolve<Room> {
  constructor(
    private estimatorService: EstimatorService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}
  resolve(route: ActivatedRouteSnapshot): Observable<Room> {
    return this.authService.user.pipe(
      take(1),
      mergeMap((user) => {
        const roomId = route.paramMap.get('roomId');

        if (!user?.uid) {
          throw new NotLoggedInError('User is not signed in');
        }
        return this.estimatorService.getRoomById(roomId).pipe(
          take(1),
          map((room) => ({ room, user }))
        );
      }),
      tap(({ room, user }) => {
        const activeMember = room.members.find((m) => m.id === user.uid);

        if (!activeMember) {
          throw new MemberNotFoundError();
        }
      }),
      map(({ room }) => room),
      catchError((error) => {
        if (error instanceof RoomNotFoundError) {
          this.showMessage(
            'Room not found. Please check the room ID or create a new room.'
          );
          this.router.navigate(['join'], { queryParams: { error: 1 } });
        } else if (
          error instanceof MemberNotFoundError ||
          error instanceof NotLoggedInError
        ) {
          this.showMessage(
            'You have not joined this room before. Join as an estimator or observer now!'
          );
          const roomId = route.paramMap.get('roomId');
          this.router.navigate(['join'], { queryParams: { roomId, error: 1 } });
        } else {
          console.error(error);
          this.showMessage('Unable to join this room. Please try again later.');
          this.router.navigate(['/'], { queryParams: { error: 1 } });
        }
        return of(null);
      })
    );
  }

  showMessage(message: string) {
    this.snackBar.open(message, null, { duration: 5000 });
  }
}
