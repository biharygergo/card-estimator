import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { CardSetValue, Member, MemberType, Room, RoundStatistics } from 'src/app/types';

@Component({
  selector: 'app-round-results',
  templateUrl: './round-results.component.html',
  styleUrls: ['./round-results.component.scss']
})
export class RoundResultsComponent {
  @Input() room: Room;
  @Input() roundStatistics: RoundStatistics;
  @Input() members: Member[];
  @Input() currentRound: number;
  @Input() selectedEstimationCardSetValue: CardSetValue;

  readonly MemberType = MemberType;
}
