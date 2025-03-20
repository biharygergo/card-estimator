import { Component } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { first } from 'rxjs';
import { EstimatorService } from 'src/app/services/estimator.service';
import { MatInput } from '@angular/material/input';
import { MatFormField } from '@angular/material/form-field';
import { MatButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';

@Component({
    selector: 'app-star-rating',
    templateUrl: './star-rating.component.html',
    styleUrls: ['./star-rating.component.scss'],
    imports: [
        MatIcon,
        MatButton,
        MatFormField,
        MatInput,
        FormsModule,
        ReactiveFormsModule,
    ]
})
export class StarRatingComponent {
  rating = 0;
  stars = [0, 0, 0, 0, 0];

  submitted = false;
  additionalFeedback = new FormControl('', { nonNullable: true });
  feedbackId: string;

  constructor(
    private readonly estimatorService: EstimatorService,
    private readonly snackbarRef: MatSnackBarRef<StarRatingComponent>
  ) {}

  toggleStarsUntil(starIndex: number) {
    this.rating = starIndex + 1;
    for (let i = 0; i < this.stars.length; i++) {
      this.stars[i] = i <= starIndex ? 1 : 0;
    }
  }

  submit() {
    if (this.rating === 0) return;
    this.estimatorService
      .submitFeedback(this.rating)
      .pipe(first())
      .subscribe((ref) => {
        this.feedbackId = ref.id;
        this.submitted = true;
      });
  }

  clickedSubmitWithFeedback() {
    this.estimatorService
      .updateFeedback(this.feedbackId, this.additionalFeedback.value)
      .pipe(first())
      .subscribe(() => {
        this.snackbarRef.dismiss();
      });
  }

  closeSnackbar() {
    this.snackbarRef.dismiss();
  }
}
