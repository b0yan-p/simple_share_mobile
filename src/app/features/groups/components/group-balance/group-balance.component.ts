import { DecimalPipe, NgClass } from '@angular/common';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { IonIcon, IonSpinner, ModalController } from '@ionic/angular/standalone';
import { BehaviorSubject, switchMap } from 'rxjs';
import { ChipComponent } from 'src/app/shared/components/chip/chip.component';
import { BalanceResponse, DebtEdge } from '../../models/balance-response.model';
import { GroupService } from '../../services/group.service';
import { SettleUpModalComponent } from '../settle-up-modal/settle-up-modal.component';

@Component({
  selector: 'app-group-balance',
  templateUrl: './group-balance.component.html',
  styleUrls: ['./group-balance.component.scss'],
  standalone: true,
  imports: [NgClass, DecimalPipe, IonIcon, IonSpinner, ChipComponent],
})
export class GroupBalanceComponent implements OnInit {
  private service = inject(GroupService);
  private route = inject(ActivatedRoute);
  private destroy = inject(DestroyRef);
  private modalController = inject(ModalController);

  balance = signal<BalanceResponse | null>(null);
  expandedMemberId = signal<string | null>(null);
  loading = signal(true);
  groupId = signal<string>('');

  private readonly refresh$ = new BehaviorSubject<void>(undefined);

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
        switchMap((params) => {
          this.groupId.set(params['id']);
          return this.refresh$.pipe(
            switchMap(() => this.service.getGroupBalances(params['id'])),
          );
        }),
        takeUntilDestroyed(this.destroy),
      )
      .subscribe({
        next: (data) => {
          this.balance.set(data);
          this.loading.set(false);
        },
        error: () => this.loading.set(false),
      });
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
        groupId: this.groupId(),
      },
      breakpoints: [0, 0.85],
      initialBreakpoint: 0.85,
    });

    await modal.present();

    const { data, role } = await modal.onWillDismiss();

    if (role === 'confirm' && data?.success) {
      this.loading.set(true);
      this.refresh$.next();
    }
  }
}
