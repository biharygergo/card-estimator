import { Injectable } from '@angular/core';
import { EstimateConverterPipe } from './../pipes/estimate-converter.pipe';
import { Member, Room } from './../types';
import { getHumanReadableElapsedTime } from './../utils';

const CSV_HEADERS_BEFORE_NAMES = ['Round'];
const CSV_HEADERS_AFTER_NAMES = ['Average', 'Duration', 'Notes'];

type ExportedDataRow = {
  estimates: {
    [id: string]: string;
  };
  average: string;
  duration: string;
  topic: string;
  notes: string;
};

class ExportData {
  members: { [id: string]: Member };
  rows: ExportedDataRow[] = [];
  converter = new EstimateConverterPipe();

  constructor(room: Room) {
    this.members = room.members.reduce((acc, curr) => {
      acc[curr.id] = curr;
      return acc;
    }, {});
    this.rows = Object.values(room.rounds).map((round) => {
      const estimates = Object.entries(round.estimates).reduce(
        (acc, [id, estimate]) => {
          acc[id] = this.converter
            .transform(estimate, room.cardSet, 'exact')
            .toString();
          if (this.members[id] === undefined) {
            this.members[id] = { name: 'Unknown Voter', id };
          }
          return acc;
        },
        {}
      );

      const estimateValues = Object.values(round.estimates);
      const average =
        estimateValues.reduce((acc, curr) => acc + curr, 0) /
        estimateValues.length;

      const result = {
        estimates,
        average: this.converter
          .transform(average, room.cardSet, 'rounded')
          .toString(),
        duration: getHumanReadableElapsedTime(round),
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

  exportRoomAsCsv(room: Room) {
    try {
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
        content.push(row.duration);
        content.push(row.notes);

        csvContent += content.join(',') + '\n';
      });

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
