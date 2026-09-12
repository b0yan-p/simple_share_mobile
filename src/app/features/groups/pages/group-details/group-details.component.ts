import { NgClass } from '@angular/common';
import { Component, input, output } from '@angular/core';
import { IonButton, IonGrid, IonIcon, IonRow } from '@ionic/angular/standalone';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { GroupOverview } from '../../models/group-overview.model';

@Component({
  selector: 'app-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss'],
  standalone: true,
  imports: [IonButton, IonIcon, NgClass, IonGrid, IonRow, ChipComponent],
})
export class GroupDetailsComponent {
  /**
   * Handed down by the group screen wrapper, which already loads (and caches) the
   * overview. This component used to fetch it a second time for the same screen.
   * Null when there is nothing to show — offline with an empty cache.
   */
  readonly group = input<GroupOverview | null>(null);
  openBalance = output<void>();
}
