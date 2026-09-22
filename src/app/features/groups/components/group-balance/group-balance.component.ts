import { DecimalPipe, NgClass } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { IonIcon, IonSpinner, ModalController } from '@ionic/angular/standalone';
import { switchMap } from 'rxjs';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { DebtEdge } from '../../models/balance-response.model';
import { GroupBalanceFacade } from '../../services/group-balance-facade.service';
import { SettleUpModalComponent } from '../settle-up-modal/settle-up-modal.component';

@Component({
  selector: 'app-group-balance',
  templateUrl: './group-balance.component.html',
  styleUrls: ['./group-balance.component.scss'],
  standalone: true,
  imports: [NgClass, DecimalPipe, IonIcon, IonSpinner, ChipComponent],
})
export class GroupBalanceComponent implements OnInit {
  private balanceFacade = inject(GroupBalanceFacade);
  private route = inject(ActivatedRoute);
  private destroy = inject(DestroyRef);
  private modalController = inject(ModalController);

  // Read straight off the root-provided store: the group screen's @switch
  // destroys this component whenever another tab is active, and a pull-to-refresh
  // has to be able to reload balances while that is the case.
  readonly balance = this.balanceFacade.store.balance;
  readonly loading = this.balanceFacade.store.loading;
  readonly groupId = this.balanceFacade.store.groupId;

  expandedMemberId = signal<string | null>(null);

  edgesMap = computed(() => {
    const b = this.balance();

    if (!b) return new Map<string, DebtEdge[]>();

    const map = new Map<string, DebtEdge[]>();
    for (const member of b.members) map.set(member.memberId, []);

    for (const edge of b.debts) {
      map.get(edge.debtorMemberId)?.push(edge);
      if (edge.debtorMemberId !== edge.creditorMemberId)
        map.get(edge.creditorMemberId)?.push(edge);
    }
    return map;
  });

  ngOnInit(): void {
    this.route.params
      .pipe(
        switchMap((params) => this.balanceFacade.loadBalances(params['id'])),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe(() => this.expandedMemberId.set(this.balance()?.members[0]?.memberId ?? null));
  }

  toggle(memberId: string): void {
    this.expandedMemberId.set(this.expandedMemberId() === memberId ? null : memberId);
  }

  getEdgesForMember(memberId: string): DebtEdge[] {
    return this.edgesMap().get(memberId) ?? [];
  }

  getInitials(displayName: string): string {
    return displayName
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  async openSettleUp(edge: DebtEdge, event: Event): Promise<void> {
    event.stopPropagation();
    const currentMemberId = this.balance()?.currentMemberId ?? '';

    const fromIsCurrentUser = edge.debtorMemberId === currentMemberId;
    const toIsCurrentUser = edge.creditorMemberId === currentMemberId;

    const modal = await this.modalController.create({
      component: SettleUpModalComponent,
      componentProps: {
        fromMemberId: edge.debtorMemberId,
        toMemberId: edge.creditorMemberId,
        fromLabel: fromIsCurrentUser ? 'You' : edge.debtorDisplayName,
        toLabel: toIsCurrentUser ? 'You' : edge.creditorDisplayName,
        fromIsCurrentUser,
        toIsCurrentUser,
        defaultAmount: edge.amount,
        groupId: this.groupId() ?? '',
      },
      breakpoints: [0, 0.85],
      initialBreakpoint: 0.85,
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data?.success) {
      this.balanceFacade.loadBalances(this.groupId() ?? '').subscribe();
    }
  }
}
