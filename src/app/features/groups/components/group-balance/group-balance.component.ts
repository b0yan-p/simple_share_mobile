import { DecimalPipe } from '@angular/common';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  linkedSignal,
  OnInit,
  output,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { IonIcon, IonSpinner, ModalController } from '@ionic/angular/standalone';
import { switchMap } from 'rxjs';
import {
  checkmarkCircleOutline,
  chevronDownOutline,
  chevronForwardOutline,
  peopleOutline,
} from 'ionicons/icons';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { BalanceResponse, DebtEdge } from '../../models/balance-response.model';
import { GroupBalanceFacade } from '../../services/group-balance-facade.service';
import { SettleUpModalComponent } from '../settle-up-modal/settle-up-modal.component';

@Component({
  selector: 'app-group-balance',
  templateUrl: './group-balance.component.html',
  styleUrls: ['./group-balance.component.scss'],
  standalone: true,
  imports: [AvatarComponent, EmptyStateComponent, DecimalPipe, IonIcon, IonSpinner],
})
export class GroupBalanceComponent implements OnInit {
  readonly balanceFacade = inject(GroupBalanceFacade);
  private route = inject(ActivatedRoute);
  private destroy = inject(DestroyRef);
  private modalController = inject(ModalController);

  // Read straight off the root-provided store: the group screen's @switch
  // destroys this component whenever another tab is active, and a pull-to-refresh
  // has to be able to reload balances while that is the case.
  readonly balance = this.balanceFacade.store.balance;
  readonly loading = this.balanceFacade.store.loading;
  readonly groupId = this.balanceFacade.store.groupId;
  readonly paymentRecorded = output<void>();

  readonly icons = {
    chevronDownOutline,
    chevronForwardOutline,
    checkmarkCircleOutline,
    peopleOutline,
  };
  readonly sections = computed(() => {
    const data = this.balance();
    if (!data) return [];
    return [
      {
        title: 'Your settlements',
        members: data.members.filter((m) => m.memberId === data.currentMemberId),
      },
      {
        title: 'Other members’ settlements',
        members: data.members.filter((m) => m.memberId !== data.currentMemberId),
      },
    ].filter((section) => section.members.length > 0);
  });

  readonly expandedMemberId = linkedSignal<BalanceResponse | null, string | null>({
    source: this.balance,
    computation: (data, previous) => {
      if (!data) return null;
      if (
        previous?.source?.groupId === data.groupId &&
        (previous.value === null || data.members.some((m) => m.memberId === previous.value))
      ) {
        return previous.value;
      }
      return data.members.find((m) => m.memberId === data.currentMemberId)?.memberId ?? null;
    },
  });

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
      .subscribe();
  }

  toggle(memberId: string): void {
    this.expandedMemberId.set(this.expandedMemberId() === memberId ? null : memberId);
  }

  getEdgesForMember(memberId: string): DebtEdge[] {
    return this.edgesMap().get(memberId) ?? [];
  }

  debtLabel(edge: DebtEdge, currentMemberId: string): string {
    if (edge.debtorMemberId === currentMemberId) return `You owe ${edge.creditorDisplayName}`;
    if (edge.creditorMemberId === currentMemberId) return `${edge.debtorDisplayName} owes you`;
    return `${edge.debtorDisplayName} owes ${edge.creditorDisplayName}`;
  }

  async openSettleUp(edge: DebtEdge): Promise<void> {
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
        currency: this.balance()?.currency,
      },
      breakpoints: [0, 0.85],
      initialBreakpoint: 0.85,
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data?.success) {
      this.balanceFacade.loadBalances(this.groupId() ?? '').subscribe();
      this.paymentRecorded.emit();
    }
  }
}
