import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router, ActivatedRouteSnapshot } from '@angular/router';
import {
  catchError,
  first,
  from,
  map,
  Observable,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';
import { AuthService } from '../services/auth.service';
import {
  EstimatorService,
  MemberNotFoundError,
  NotLoggedInError,
  RoomNotFoundError,
} from '../services/estimator.service';
import { PermissionsService } from '../services/permissions.service';
import { MemberStatus, Room } from '../types';

@Injectable({
  providedIn: 'root',
})
export class RoomResolver {
  constructor(
    private estimatorService: EstimatorService,
    private authService: AuthService,
    private router: Router,
    private snackBar: MatSnackBar,
    private readonly permissionsService: PermissionsService
  ) {}
  resolve(route: ActivatedRouteSnapshot): Observable<Room> {
    return this.authService.user.pipe(
      take(1),
      switchMap(user => {
        const roomId = route.paramMap.get('roomId');

        if (!user?.uid) {
          throw new NotLoggedInError('User is not signed in');
        }
        return this.estimatorService.getRoomById(roomId).pipe(
          first(),
          map(room => ({ room, user }))
        );
      }),
      switchMap(({ room, user }) => {
        const activeMember = room.members.find(m => m.id === user.uid);

        if (!activeMember) {
          throw new MemberNotFoundError();
        }

        if (
          activeMember.status !== MemberStatus.ACTIVE ||
          !room.memberIds.includes(user.uid)
        ) {
          return from(
            this.estimatorService.joinRoom(room.roomId, {
              ...activeMember,
              status: MemberStatus.ACTIVE,
            })
          ).pipe(
            switchMap(() =>
              this.estimatorService.getRoomById(room.roomId).pipe(first())
            ),
            map(updatedRoom => ({ room: updatedRoom, user }))
          );
        }

        return of({ room, user });
      }),
      tap(({ room, user }) => {
        this.permissionsService.initializePermissions(room, user.uid);
      }),
      map(({ room }) => room),
      catchError(error => {
        if (error instanceof RoomNotFoundError) {
          this.showMessage(
            'Room not found. Please check the room ID or create a new room.'
          );
          this.router.navigate(['join'], {
            queryParams: { error: 1 },
          });
        } else if (
          error instanceof MemberNotFoundError ||
          error instanceof NotLoggedInError ||
          error?.code === 'permission-denied'
        ) {
          const roomId = route.paramMap.get('roomId');
          this.router.navigate(['join'], {
            queryParams: { roomId, error: 1 },
          });
        } else {
          console.error(error);
          this.showMessage('Unable to join this room. Please try again later.');
          this.router.navigate(['/'], {
            queryParams: { error: 1 },
          });
        }
        return of(null);
      })
    );
  }

  showMessage(message: string) {
    this.snackBar.open(message, null, {
      duration: 5000,
      horizontalPosition: 'right',
    });
  }
}
