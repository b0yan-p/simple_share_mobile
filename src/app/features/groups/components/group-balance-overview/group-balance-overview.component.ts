import { DecimalPipe, NgClass } from '@angular/common';
import { Component, input } from '@angular/core';
import { IonIcon, IonItem, IonList } from '@ionic/angular/standalone';
import { MyDebtSummary } from '../../models/group-overview.model';

@Component({
  selector: 'app-group-balance-overview',
  templateUrl: './group-balance-overview.component.html',
  styleUrls: ['./group-balance-overview.component.scss'],
  imports: [IonIcon, IonItem, IonList, NgClass, DecimalPipe],
})
export class GroupBalanceOverviewComponent {
  data = input.required<MyDebtSummary>();
}
