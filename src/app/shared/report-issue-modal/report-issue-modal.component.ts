import { Component, Inject } from '@angular/core';
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogTitle,
  MatDialogContent,
  MatDialogActions,
  MatDialogClose,
} from '@angular/material/dialog';
import { MatButton } from '@angular/material/button';
import {
  MatFormField,
  MatLabel,
  MatError,
  MatHint,
} from '@angular/material/form-field';
import { ModalCreator } from '../avatar-selector-modal/avatar-selector-modal.component';
import { MatInput } from '@angular/material/input';
import { IssueReportService } from '../../services/issue-report.service';
import { from } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { ToastService } from 'src/app/services/toast.service';

export interface ReportIssueModalData {
  // Add any data you want to pass to the modal
}

export const reportIssueModalCreator = (
  data?: ReportIssueModalData
): ModalCreator<ReportIssueModalComponent> => [
  ReportIssueModalComponent,
  {
    id: 'reportIssueModal',
    width: '90%',
    maxWidth: '600px',
    maxHeight: '98vh',
    data: data || {},
    panelClass: 'custom-dialog',
  },
];

@Component({
  selector: 'app-report-issue-modal',
  imports: [
    ReactiveFormsModule,
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    MatFormField,
    MatLabel,
    MatInput,
    MatError,
    MatHint,
  ],
  templateUrl: './report-issue-modal.component.html',
  styleUrl: './report-issue-modal.component.scss',
})
export class ReportIssueModalComponent {
  issueDetails = new FormControl('', [Validators.required]);
  emailAddress = new FormControl('', [Validators.email]);
  isSubmitting = false;

  constructor(
    private dialogRef: MatDialogRef<ReportIssueModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ReportIssueModalData,
    private issueReportService: IssueReportService,
    private readonly toastService: ToastService
  ) {}

  isFormValid(): boolean {
    return this.issueDetails.valid && this.emailAddress.valid;
  }

  submitIssue(): void {
    if (this.isFormValid() && !this.isSubmitting) {
      this.isSubmitting = true;

      const issueReport = {
        details: this.issueDetails.value!,
        email: this.emailAddress.value!,
      };

      from(this.issueReportService.submitIssueReport(issueReport))
        .pipe(
          finalize(() => {
            this.isSubmitting = false;
          })
        )
        .subscribe({
          next: result => {
            this.toastService.showMessage(
              'Issue report submitted successfully'
            );
            this.dialogRef.close({ success: true, reportId: result.id });
          },
          error: error => {
            console.error('Error submitting issue report:', error);
            this.toastService.showMessage(
              'Error submitting issue report',
              3000,
              'error'
            );
            this.dialogRef.close({ success: false, error });
          },
        });
    }
  }
}
