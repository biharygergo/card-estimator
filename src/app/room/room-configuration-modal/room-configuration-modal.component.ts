import { Component } from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { ModalCreator } from 'src/app/shared/avatar-selector-modal/avatar-selector-modal.component';
import { MemberType } from 'src/app/types';

const ROOM_CONFIGURATION_MODAL = 'roomConfigurationModal';
export const roomConfigurationModalCreator =
  (): ModalCreator<RoomConfigurationModalComponent> => [
    RoomConfigurationModalComponent,
    {
      id: ROOM_CONFIGURATION_MODAL,
      width: '90%',
      maxWidth: '600px',
    },
  ];

class ChipOption<T> {
  selectedValues: T[] = [];
  selectedValuesMap: { [key: string]: T };

  constructor(
    public prompt: string,
    public icon: string,
    public options: { value: T; label: string }[],
    initialSelection: T[]
  ) {
    this.selectedValues = [...initialSelection];
    this.selectedValuesMap = initialSelection.reduce((acc, curr) => {
      acc[this.createKey(curr)] = curr;
      return acc;
    }, {});
  }

  toggleOption(option: T) {
    const key = this.createKey(option);
    if (this.selectedValuesMap[key]) {
      delete this.selectedValuesMap[key];
    } else {
      this.selectedValuesMap[key] = option;
    }

    this.selectedValues = Object.values(this.selectedValuesMap);
  }

  isSelected(option: T) {
    return !!this.selectedValuesMap[this.createKey(option)];
  }

  private createKey(option: T) {
    return JSON.stringify(option);
  }
}

const CREATOR_OPTION = { value: MemberType.CREATOR, label: 'Creator' };
const ESTIMATOR_OPTION = { value: MemberType.ESTIMATOR, label: 'Estimators' };
const OBSERVER_OPTION = { value: MemberType.OBSERVER, label: 'Observers' };

@Component({
  selector: 'app-room-configuration-modal',
  templateUrl: './room-configuration-modal.component.html',
  styleUrls: ['./room-configuration-modal.component.scss'],
})
export class RoomConfigurationModalComponent {
  permissionConfiguration = {
    voters: new ChipOption(
      'Who can vote on topics?',
      'ballot',
      [CREATOR_OPTION, ESTIMATOR_OPTION, OBSERVER_OPTION],
      [MemberType.CREATOR, MemberType.ESTIMATOR]
    ),
    topicEditors: new ChipOption(
      'Who can edit topic names?',
      'edit',
      [CREATOR_OPTION, ESTIMATOR_OPTION, OBSERVER_OPTION],
      [MemberType.CREATOR, MemberType.OBSERVER, MemberType.ESTIMATOR]
    ),
    roundCreators: new ChipOption(
      'Who can create new rounds?',
      'add_circle',
      [CREATOR_OPTION, ESTIMATOR_OPTION, OBSERVER_OPTION],
      [MemberType.CREATOR, MemberType.OBSERVER, MemberType.ESTIMATOR]
    ),
    noteTakers: new ChipOption(
      'Who can take notes?',
      'edit_note',
      [CREATOR_OPTION, ESTIMATOR_OPTION, OBSERVER_OPTION],
      [MemberType.CREATOR, MemberType.OBSERVER, MemberType.ESTIMATOR]
    ),
    roundRevealers: new ChipOption(
      'Who can reveal the vote results?',
      'visibility',
      [CREATOR_OPTION, ESTIMATOR_OPTION, OBSERVER_OPTION],
      [MemberType.CREATOR, MemberType.OBSERVER, MemberType.ESTIMATOR]
    ),
    velocityViewers: new ChipOption(
      'Who can view the team velocity?',
      'monitoring',
      [CREATOR_OPTION, ESTIMATOR_OPTION, OBSERVER_OPTION],
      [MemberType.CREATOR, MemberType.OBSERVER, MemberType.ESTIMATOR]
    ),
    resultDownloaders: new ChipOption(
      'Who can export the results?',
      'download',
      [CREATOR_OPTION, ESTIMATOR_OPTION, OBSERVER_OPTION],
      [MemberType.CREATOR, MemberType.OBSERVER, MemberType.ESTIMATOR]
    ),
  };

  permissionForms = Object.values(this.permissionConfiguration);
  personalizedRoomId = new FormControl<string>('', [Validators.minLength(8)]);
}
