import { DecimalPipe, NgClass } from '@angular/common';
import { Component, inject, input, output } from '@angular/core';
import { IonIcon, IonItem, IonList, ModalController } from '@ionic/angular/standalone';
import { GroupDebtEdge, MyDebtSummary } from '../../models/group-overview.model';
import { SettleUpModalComponent } from '../settle-up-modal/settle-up-modal.component';

@Component({
  selector: 'app-group-balance-overview',
  templateUrl: './group-balance-overview.component.html',
  styleUrls: ['./group-balance-overview.component.scss'],
  imports: [IonIcon, IonItem, IonList, NgClass, DecimalPipe],
})
export class GroupBalanceOverviewComponent {
  data = input.required<MyDebtSummary>();
  groupId = input.required<string>();
  currentMemberId = input.required<string>();
  settled = output<void>();

  private modalController = inject(ModalController);

  async openSettleUp(edge: GroupDebtEdge): Promise<void> {
    // signedAmount > 0 → other owes me → other is FROM (debtor), I am TO (creditor)
    // signedAmount < 0 → I owe other → I am FROM (debtor), other is TO (creditor)
    const otherOwesMe = edge.signedAmount > 0;

    const fromMemberId = otherOwesMe ? edge.otherMemberId : this.currentMemberId();
    const toMemberId = otherOwesMe ? this.currentMemberId() : edge.otherMemberId;
    const fromLabel = otherOwesMe ? edge.otherDisplayName : 'You';
    const toLabel = otherOwesMe ? 'You' : edge.otherDisplayName;
    const fromIsCurrentUser = !otherOwesMe;
    const toIsCurrentUser = otherOwesMe;

    const modal = await this.modalController.create({
      component: SettleUpModalComponent,
      componentProps: {
        fromMemberId,
        toMemberId,
        fromLabel,
        toLabel,
        fromIsCurrentUser,
        toIsCurrentUser,
        defaultAmount: edge.amount,
        groupId: this.groupId(),
      },
      breakpoints: [0, 0.85],
      initialBreakpoint: 0.85,
    });

    await modal.present();
    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data?.success) {
      this.settled.emit();
    }
  }
}
