import { Component } from '@angular/core';
import { FormControl } from '@angular/forms';
import { MatSnackBarRef } from '@angular/material/snack-bar';
import { first } from 'rxjs';
import { EstimatorService } from 'src/app/services/estimator.service';

@Component({
  selector: 'app-star-rating',
  templateUrl: './star-rating.component.html',
  styleUrls: ['./star-rating.component.scss'],
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

  clickedOpenDetailedFeedback() {
    this.snackbarRef.dismissWithAction();
  }

  closeSnackbar() {
    this.snackbarRef.dismiss();
  }
}
