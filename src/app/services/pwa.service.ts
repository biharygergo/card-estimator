import { Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { ToastService } from './toast.service';
import { filter, take } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class PwaService {
  constructor(
    updates: SwUpdate,
    private readonly toastService: ToastService
  ) {
    updates.versionUpdates
      .pipe(
        filter((evt): evt is VersionReadyEvent => evt.type === 'VERSION_READY')
      )
      .subscribe((evt) => {
        const ref = this.toastService.showMessage(
          'A new version of the app is available. Please refresh the page to get the best experience',
          20000,
          'info',
          'Refresh'
        );

        ref.onAction().pipe(take(1)).subscribe(() => {
          document.location.reload();

        })
      });

    updates.unrecoverable.subscribe((event) => {
      const ref = this.toastService.showMessage(
        'A fatal error occured while trying to load the application. Please refresh the page to fix it.',
        20000,
        'error',
        'Refresh'
      );

      ref
        .onAction()
        .pipe(take(1))
        .subscribe(() => {
          document.location.reload();
        });
    });
  }
}
