import { DecimalPipe } from '@angular/common';
import { Component, computed, DestroyRef, inject, Input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonSpinner,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import {
  arrowDownOutline,
  arrowUpOutline,
  chevronForwardOutline,
  closeOutline,
  swapHorizontalOutline,
} from 'ionicons/icons';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { apiErrorMessage } from 'src/app/core/services/api-error';
import { BalanceResponse, DebtEdge } from '../../models/balance-response.model';
import { GroupService } from '../../services/group.service';
import { SettleUpModalComponent } from '../settle-up-modal/settle-up-modal.component';

@Component({
  selector: 'app-settle-up-balance-picker',
  standalone: true,
  imports: [
    AvatarComponent,
    DecimalPipe,
    IonButton,
    IonButtons,
    IonContent,
    IonHeader,
    IonIcon,
    IonSpinner,
    IonToolbar,
    SettleUpModalComponent,
  ],
  templateUrl: './settle-up-balance-picker.component.html',
  styleUrls: ['./settle-up-balance-picker.component.scss'],
})
export class SettleUpBalancePickerComponent implements OnInit {
  @Input({ required: true }) groupId!: string;
  @Input({ required: true }) onSubmittingChange!: (value: boolean) => void;

  private readonly groupService = inject(GroupService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly modalController = inject(ModalController);

  protected readonly icons = {
    arrowDownOutline,
    arrowUpOutline,
    chevronForwardOutline,
    closeOutline,
    swapHorizontalOutline,
  };

  protected readonly balance = signal<BalanceResponse | null>(null);
  protected readonly loadState = signal<'loading' | 'ready' | 'error'>('loading');
  protected readonly errorMessage = signal('');
  protected readonly selection = signal<{ debt: DebtEdge; outgoing: boolean } | null>(null);

  protected readonly sections = computed(() => {
    const balance = this.balance();
    if (!balance) return [];

    const { currentMemberId, debts } = balance;
    return [
      {
        title: 'You owe',
        outgoing: true,
        debts: debts.filter((debt) => debt.debtorMemberId === currentMemberId),
      },
      {
        title: 'You are owed',
        outgoing: false,
        debts: debts.filter((debt) => debt.creditorMemberId === currentMemberId),
      },
    ].filter((section) => section.debts.length > 0);
  });

  ngOnInit(): void {
    this.loadBalances();
  }

  protected loadBalances(): void {
    this.loadState.set('loading');
    this.groupService
      .getGroupBalances(this.groupId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (balance) => {
          this.balance.set(balance);
          this.loadState.set('ready');
        },
        error: (err) => {
          this.errorMessage.set(apiErrorMessage(err, 'Could not load your balances.'));
          this.loadState.set('error');
        },
      });
  }

  protected dismiss(): void {
    void this.modalController.dismiss(null, 'cancel');
  }
}
