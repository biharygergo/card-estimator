import { ErrorHandler, Injectable } from '@angular/core';
import { ToastService } from './services/toast.service';
import * as Sentry from '@sentry/angular';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  constructor(
    private toastService: ToastService,
  ) {}

  handleError(error: any): void {
    const chunkFailedMessage = /Loading chunk [\d]+ failed/;

    if (chunkFailedMessage.test(error.message)) {
      this.showErrorToast(
        `There was an error while loading parts of the application. Please reload the page.`
      );
    } else if (error.message?.includes('AppCheck')) {
      this.showErrorToast(
        `We couldn't verify your identity with AppCheck and therefore your access was automatically blocked. ${error.code}`
      );
    } else if (error.code?.includes('network-request-failed')) {
      this.showErrorToast(
        'Network issue detected. Please check your connection and try again.'
      );
    } else {
      this.showErrorToast(error);
    }
    console.error('Received an error', error);
    Sentry.captureException(error);
  }

  showErrorToast(error: any, message?: string) {
    const toastMessage =
      message ??
      `An error occured, please try again or contact support. ${
        error.message ? `The error message is: ${error.message}` : ''
      }`;
    this.toastService.showMessage(toastMessage, 20000, 'error');
  }
}
