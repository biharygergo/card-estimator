import { Injectable } from '@angular/core';
import {
  EstimateConverterPipe,
  getRoomCardSetValue,
} from './../pipes/estimate-converter.pipe';
import { Member, MemberStatus, MemberType, Room } from './../types';
import { getHumanReadableElapsedTime } from './../utils';
import { FieldValue } from 'firebase/firestore';

const CSV_HEADERS_BEFORE_NAMES = ['Round'];
const CSV_HEADERS_AFTER_NAMES = ['Average', 'Majority', 'Notes'];

type ExportedDataRow = {
  roundId: string;
  estimates: {
    [id: string]: string;
  };
  mostPopularVote: string;
  average: string;
  duration: string;
  startedAt: FieldValue;
  topic: string;
  notes: string;
};

export class ExportData {
  members: { [id: string]: Member };
  rows: ExportedDataRow[] = [];
  converter = new EstimateConverterPipe();

  constructor(room: Room, onlyRevealedRounds = false) {
    this.members = room.members.reduce((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {});
    const cardSet = getRoomCardSetValue(room);

    this.rows = Object.values(room.rounds)
      .filter((round) => (onlyRevealedRounds ? round.show_results : true))
      .map((round) => {
        const estimates = Object.entries(round.estimates)
          .filter((estimate) => estimate[1] !== null)
          .reduce((acc, [id, estimate]) => {
            acc[id] = this.converter
              .transform(estimate, cardSet, 'exact')
              .toString();
            if (this.members[id] === undefined) {
              this.members[id] = {
                name: 'Unknown Voter',
                id,
                type: MemberType.ESTIMATOR,
                status: MemberStatus.LEFT_ROOM,
              };
            }
            return acc;
          }, {});
        const estimateValues = Object.values(round.estimates).filter(
          (estimate) => estimate !== null
        );
        let mostPopularVoteCard = '';

        if (estimateValues.length) {
          const votesCount: { [estimateKey: string]: number } =
            estimateValues.reduce((acc, curr) => {
              acc[curr] = acc[curr] ? acc[curr] + 1 : 1;
              return acc;
            }, {});

          // [estimateKey, numberOfVotes]
          const mostPopularVoteEntry: [string, number] = Object.entries<number>(
            votesCount
          ).sort((a, b) => b[1] - a[1])[0];

          mostPopularVoteCard = this.converter
            .transform(mostPopularVoteEntry[0], cardSet, 'exact')
            .toString();
        }

        const average = estimateValues.length
          ? estimateValues.reduce((acc, curr) => acc + curr, 0) /
            estimateValues.length
          : undefined;

        const result: ExportedDataRow = {
          roundId: round.id,
          estimates,
          average:
            average === undefined
              ? ''
              : this.converter
                  .transform(average, cardSet, 'rounded')
                  .toString(),
          mostPopularVote: mostPopularVoteCard,
          duration: getHumanReadableElapsedTime(round),
          startedAt: round.started_at,
          topic: round.topic,
          notes: `"${round.notes?.note}"` || '',
        };

        return result;
      });
  }
}

@Injectable({
  providedIn: 'root',
})
export class SerializerService {
  constructor() {}

  getRoomAsCsv(room: Room): string {
    const exportData = new ExportData(room);
    const members = Object.values(exportData.members);
    const headerRow = [...CSV_HEADERS_BEFORE_NAMES]
      .concat(members.map((m) => m.name))
      .concat(CSV_HEADERS_AFTER_NAMES);

    let csvContent = '';
    csvContent += headerRow.join(',') + '\n';

    exportData.rows.forEach((row) => {
      const content = [row.topic];

      members.forEach((member) => {
        content.push(row.estimates[member.id]);
      });
      content.push(row.average);
      content.push(row.mostPopularVote);
      content.push(row.notes);

      csvContent += content.join(',') + '\n';
    });
    return csvContent;
  }

  exportRoomAsCsv(room: Room) {
    try {
      const csvContent = this.getRoomAsCsv(room);

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.setAttribute('href', url);
      link.setAttribute(
        'download',
        'Planning Poker Session - ' + new Date().toLocaleString()
      );
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error(e);
    }
  }
}
