import { ErrorHandler, Injectable } from '@angular/core';
import { ToastService } from './services/toast.service';
import * as Sentry from '@sentry/angular';
import { LinkService } from './services/link.service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(
    private toastService: ToastService,
    private readonly linkService: LinkService
  ) {}

  handleError(error: any): void {
    const chunkFailedMessage = /Failed to fetch dynamically imported module/;
    console.error('Received an error', error);
    const errorMessage = typeof error === 'string' ? error : error.message;
  
    if (chunkFailedMessage.test(errorMessage)) {
      this.showErrorToast(
        error, `There was an error while loading parts of the application. Please reload the page.`
      );
    } else if (errorMessage?.includes('AppCheck')) {
      this.showErrorToast(
        error, `We couldn't verify your identity with AppCheck and therefore your access was automatically blocked. ${error.code}`
      );
      return;
    } else if (
      (typeof error.code === 'string' &&
        error.code?.includes('network-request-failed')) ||
      errorMessage?.includes('network-request-failed')
    ) {
      this.showErrorToast(
        error, 'Network issue detected. Please check your connection and try again.'
      );
      return;
    } else {
      this.showErrorToast(error);
    }
    Sentry.captureException(error);
  }

  showErrorToast(error: any, message?: string) {
    const errorMessage = typeof error === 'string' ? error : error.message;

    const toastMessage =
      message ??
      `An error occured, please try again or report this issue. ${
        errorMessage ? `The error message is: ${errorMessage.slice(0, 300)}` : ''
      }`;

    const snackbarRef = this.toastService.showMessage(
      toastMessage,
      20000,
      'error',
      'Send bug report'
    );
    snackbarRef.onAction().subscribe(() => {
      const apiUrl = window.origin + '/api/reportAnIssue';
      this.linkService.openUrl(apiUrl);
    });
  }
}
