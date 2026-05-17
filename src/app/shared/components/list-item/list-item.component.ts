import { Component, inject, input, output } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import {
  IonAlert,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
} from '@ionic/angular/standalone';
import { AvatarComponent } from '../avatar/avatar.component';

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
    IonItem,
    RouterModule,
    AvatarComponent,
  ],
})
export class ListItemComponent {
  router = inject(Router);

  id = input<string | number | null | undefined>();
  navigatePath = input<string[] | undefined>();
  title = input.required<string>();
  description = input<string>();
  meta = input<string>();
  showChevron = input<boolean>(true);
  descriptionColor = input<'default' | 'primary' | 'accent' | 'success' | 'warning' | 'error'>(
    'default',
  );

  // actions
  disableSwipeActions = input<boolean>(false);

  // events
  onUpdate = output<void>();
  onDelete = output<void>();
  onClick = output<void>();

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

  navigate() {
    if (!!this.navigatePath()) {
      this.router.navigate(this.navigatePath()!);
      return;
    }

    this.onClick.emit();
  }
}
