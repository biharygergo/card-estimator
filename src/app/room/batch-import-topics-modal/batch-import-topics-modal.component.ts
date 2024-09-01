import { Component, computed, signal } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RichTopic } from 'src/app/types';

@Component({
  selector: 'app-batch-import-topics-modal',
  standalone: true,
  imports: [MatFormFieldModule, MatInputModule, ReactiveFormsModule],
  templateUrl: './batch-import-topics-modal.component.html',
  styleUrl: './batch-import-topics-modal.component.scss',
})
export class BatchImportTopicsModalComponent {
  searchedIssues = signal<RichTopic[]>([]);
  recentIssues = signal<RichTopic[]>([]);
  selectedIssues = signal<RichTopic[]>([]);

  selectedIssueIdsMap = computed(() =>
    this.selectedIssues().reduce(
      (acc, curr) => ({ ...acc, [curr.id]: true }),
      {}
    )
  );
}
