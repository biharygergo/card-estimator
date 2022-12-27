import { Component } from '@angular/core';
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
      .subscribe(() => {
        this.submitted = true;
      });
  }

  clickedOpenDetailedFeedback() {
    this.snackbarRef.dismissWithAction();
  }

  closeSnackbar() {
    this.snackbarRef.dismiss();
  }
}
