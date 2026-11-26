import { DecimalPipe } from '@angular/common';
import { Component, computed, input, output } from '@angular/core';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import {
  arrowDownOutline,
  arrowUpOutline,
  chevronForwardOutline,
  personAddOutline,
  walletOutline,
} from 'ionicons/icons';
import { GroupOverview } from '../../models/group-overview.model';

@Component({
  selector: 'app-group-details',
  templateUrl: './group-details.component.html',
  styleUrls: ['./group-details.component.scss'],
  standalone: true,
  imports: [DecimalPipe, IonButton, IonIcon],
})
export class GroupDetailsComponent {
  readonly group = input<GroupOverview | null>(null);
  readonly openSettleUp = output<void>();
  readonly openAddPeople = output<void>();

  protected readonly icons = {
    arrowDownOutline,
    arrowUpOutline,
    chevronForwardOutline,
    personAddOutline,
    walletOutline,
  };

  protected readonly totals = computed(() => {
    let owe = 0;
    let owed = 0;

    for (const { signedAmount } of this.group()?.myDebtSummary.debtEdges ?? []) {
      if (signedAmount < 0) owe -= signedAmount;
      else owed += signedAmount;
    }
    return { owe, owed };
  });
}
