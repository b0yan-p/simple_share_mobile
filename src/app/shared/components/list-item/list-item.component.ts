import { Component, input, output } from '@angular/core';
import { RouterModule } from '@angular/router';
import {
  IonAlert,
  IonAvatar,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-list-item',
  templateUrl: './list-item.component.html',
  styleUrls: ['./list-item.component.scss'],
  imports: [
    IonAlert,
    IonIcon,
    IonItemOption,
    IonItemOptions,
    IonItemSliding,
    IonAvatar,
    IonItem,
    RouterModule,
  ],
})
export class ListItemComponent {
  navigatePath = input.required<string[]>();
  title = input.required<string>();
  description = input<string>();
  meta = input<string>();
  descriptionColor = input<'primary' | 'accent' | 'default'>('default');

  disableSwipeActions = input<boolean>(false);

  onUpdate = output<void>();
  onDelete = output<void>();

  isAlertOpen = false;
  alertButtons = [
    {
      text: 'Cancel',
      role: 'cancel',
      cssClass: 'delete-cancel',
    },
    {
      text: 'Confirm',
      role: 'confirm',
      cssClass: 'delete-confirmation',
      handler: () => {
        this.onDelete.emit();
      },
    },
  ];

  openDeleteAlert(isOpen: boolean) {
    this.isAlertOpen = isOpen;
  }
}
