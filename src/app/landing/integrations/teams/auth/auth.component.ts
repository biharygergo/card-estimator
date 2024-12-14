import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { TeamsService } from 'src/app/services/teams.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.scss'],
})
export class AuthComponent implements OnInit {
  constructor(
    private readonly route: ActivatedRoute,
    private readonly dialog: MatDialog,
    private readonly teamsService: TeamsService,
  ) {}

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    this.teamsService.configureApp().then(() => {
      this.teamsService.notifySuccess(token);
    });
  }
}
