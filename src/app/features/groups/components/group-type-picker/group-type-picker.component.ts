import { Component, computed, input, output, signal } from '@angular/core';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonTitle,
  IonToolbar,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  airplaneOutline,
  checkmarkOutline,
  chevronDownOutline,
  closeOutline,
  heartOutline,
  homeOutline,
  peopleOutline,
} from 'ionicons/icons';
import { GROUP_TYPE_TITLES, GroupType } from '../../models/group-type.model';

const GROUP_TYPES = {
  [GroupType.Trip]: {
    title: GROUP_TYPE_TITLES[GroupType.Trip],
    description: 'Split expenses on your adventures',
    icon: 'airplane-outline',
  },
  [GroupType.Roommates]: {
    title: GROUP_TYPE_TITLES[GroupType.Roommates],
    description: 'Manage rent, bills and shared costs',
    icon: 'home-outline',
  },
  [GroupType.Couple]: {
    title: GROUP_TYPE_TITLES[GroupType.Couple],
    description: 'Share everyday expenses together',
    icon: 'heart-outline',
  },
  [GroupType.Other]: {
    title: GROUP_TYPE_TITLES[GroupType.Other],
    description: 'For any other shared expenses',
    icon: 'people-outline',
  },
};

@Component({
  selector: 'app-group-type-picker',
  templateUrl: './group-type-picker.component.html',
  styleUrl: './group-type-picker.component.scss',
  imports: [
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonModal,
    IonTitle,
    IonToolbar,
  ],
})
export class GroupTypePickerComponent {
  readonly value = input.required<GroupType>();
  readonly valueChange = output<GroupType>();
  readonly opened = signal(false);
  readonly breakpoints = [0, 1];
  readonly options = [
    GroupType.Trip,
    GroupType.Roommates,
    GroupType.Couple,
    GroupType.Other,
  ].map((type) => ({ type, ...GROUP_TYPES[type] }));
  readonly selected = computed(() => GROUP_TYPES[this.value()] ?? GROUP_TYPES[GroupType.Other]);

  constructor() {
    addIcons({
      airplaneOutline,
      checkmarkOutline,
      chevronDownOutline,
      closeOutline,
      heartOutline,
      homeOutline,
      peopleOutline,
    });
  }

  select(type: GroupType): void {
    if (type !== this.value()) this.valueChange.emit(type);
    this.opened.set(false);
  }
}
