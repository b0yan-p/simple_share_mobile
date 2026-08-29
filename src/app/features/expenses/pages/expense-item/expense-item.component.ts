import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonList,
  IonModal,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  ViewWillEnter,
  ViewWillLeave,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { arrowBackSharp, cloudOfflineOutline } from 'ionicons/icons';
import { concatMap } from 'rxjs';
import { TokenStorageService } from 'src/app/auth/services/token-storage.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UiService } from 'src/app/core/services/ui.service';
import { GroupMember } from 'src/app/features/groups/models/group-member.model';
import { GroupMemberFacade } from 'src/app/features/groups/services/group-member-facade.service';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { CreateExpenseRequest } from '../../models/create-expense.model';
import { ExpenseFacade } from '../../services/expense-facade.service';
import { ExpenseService } from '../../services/expense.service';
import { AMOUNT_MIN, CURRENCY } from '../../utils/expense.constants';
import { amountsMatch, splitEqually, sumSelectedAmounts } from '../../utils/split.util';

interface MemberEntry extends GroupMember {
  selected: boolean;
  amount: number;
}

@Component({
  selector: 'app-expense-item',
  templateUrl: './expense-item.component.html',
  styleUrls: ['./expense-item.component.scss'],
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    AvatarComponent,
    EmptyStateComponent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonTitle,
    IonContent,
    IonFooter,
    IonList,
    IonItem,
    IonInput,
    IonModal,
    IonDatetime,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
})
export class ExpenseItemComponent implements ViewWillEnter, ViewWillLeave {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private expenseService = inject(ExpenseService);
  private expenseFacade = inject(ExpenseFacade);
  private toastService = inject(ToastService);
  private tokenStorage = inject(TokenStorageService);
  private groupMemberFacade = inject(GroupMemberFacade);
  uiService = inject(UiService);

  readonly currency = CURRENCY;
  readonly arrowBack = arrowBackSharp;
  readonly stepsCount = 3;
  currentStep = 1;
  groupId = '';
  editMode = false;
  expenseId = '';
  pendingMode = false;
  pendingTempId = '';
  /** Members could not be loaded from either the network or the cache. */
  readonly membersError = signal(false);

  form = new FormGroup({
    totalAmount: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(AMOUNT_MIN),
    ]),
    description: new FormControl<string>('', [Validators.required]),
    expenseDate: new FormControl<string | null>(new Date().toISOString()),
  });

  paidByEntries: MemberEntry[] = [];
  splitEntries: MemberEntry[] = [];
  paidByMode: 'equal' | 'custom' = 'equal';
  splitMode: 'equal' | 'custom' = 'equal';

  get totalAmount(): number {
    return this.form.value.totalAmount ?? 0;
  }

  get paidByTotal(): number {
    return sumSelectedAmounts(this.paidByEntries);
  }

  get splitTotal(): number {
    return sumSelectedAmounts(this.splitEntries);
  }

  get noneSelectedPayer(): boolean {
    return !this.paidByEntries.some((e) => e.selected);
  }

  get noneSelectedSplit(): boolean {
    return !this.splitEntries.some((e) => e.selected);
  }

  get paidByValid(): boolean {
    return !this.noneSelectedPayer && amountsMatch(this.paidByTotal, this.totalAmount);
  }

  get splitValid(): boolean {
    return !this.noneSelectedSplit && amountsMatch(this.splitTotal, this.totalAmount);
  }

  constructor() {
    addIcons({
      arrowBackSharp,
      cloudOfflineOutline,
    });
  }

  ionViewWillEnter(): void {
    // Focused wizard: hide the bottom tab bar so only the pinned CTA shows.
    this.uiService.tabBarVisible.set(false);

    this.currentStep = 1;
    this.editMode = false;
    this.expenseId = '';
    this.pendingMode = false;
    this.pendingTempId = '';
    this.paidByMode = 'equal';
    this.splitMode = 'equal';
    this.form.reset({ expenseDate: new Date().toISOString() });

    this.groupId = this.route.snapshot.params['id'];
    const expenseId = this.route.snapshot.params['expenseId'];
    const pendingId = this.route.snapshot.params['pendingId'];

    if (expenseId) {
      this.editMode = true;
      this.expenseId = expenseId;
    } else if (pendingId) {
      this.pendingMode = true;
      this.pendingTempId = pendingId;
    }
    this.loadMembers();
  }

  ionViewWillLeave(): void {
    // Restore the tab bar for the rest of the app.
    this.uiService.tabBarVisible.set(true);
  }

  /**
   * Public so the empty state can retry. The facade is the single source of truth
   * here — it is network-first with a cache fallback, which this screen used to
   * reimplement without the fallback.
   */
  loadMembers(): void {
    this.membersError.set(false);

    this.groupMemberFacade.getGroupMembers(this.groupId).subscribe({
      next: (members) => {
        this.paidByEntries = members.map((m) => ({ ...m, selected: false, amount: 0 }));
        this.splitEntries = members.map((m) => ({ ...m, selected: true, amount: 0 }));
        if (this.pendingMode) this.loadPendingExpenseData();
        else if (this.editMode) this.loadExpenseData();
        else this.recalculateEqualSplit();
      },
      // An inline state rather than a redirect: router.navigate() from the async
      // tail of ionViewWillEnter races the Ionic transition and can be dropped,
      // which left the user on a wizard with no members and no explanation.
      error: () => this.membersError.set(true),
    });
  }

  private loadPendingExpenseData(): void {
    this.expenseFacade.getPendingExpense(this.pendingTempId).subscribe({
      next: (pending) => {
        if (!pending) return;
        this.form.patchValue({
          totalAmount: pending.payload.totalAmount,
          description: pending.payload.description,
          expenseDate: pending.payload.expenseDate,
        });

        this.paidByEntries.forEach((entry) => {
          const match = pending.payload.payments.find((p) => p.memberId === entry.memberId);
          entry.selected = !!match;
          entry.amount = match?.amount ?? 0;
        });
        this.paidByMode = 'custom';

        this.splitEntries.forEach((entry) => {
          const match = pending.payload.splits.find((s) => s.memberId === entry.memberId);
          entry.selected = !!match;
          entry.amount = match?.amount ?? 0;
        });
        this.splitMode = 'custom';
      },
      error: () => this.toastService.errorToast('Failed to load pending expense'),
    });
  }

  private loadExpenseData(): void {
    this.expenseService.getExpense(this.groupId, this.expenseId).subscribe({
      next: (expense) => {
        this.form.patchValue({
          totalAmount: expense.amount,
          description: expense.description,
          expenseDate: expense.expenseDate,
        });

        this.paidByEntries.forEach((entry) => {
          const match = expense.paidBy.find((p) => p.memberId === entry.memberId);
          entry.selected = !!match;
          entry.amount = match?.amount ?? 0;
        });
        this.paidByMode = 'custom';

        this.splitEntries.forEach((entry) => {
          const match = expense.splittedBy.find((s) => s.memberId === entry.memberId);
          entry.selected = !!match;
          entry.amount = match?.amount ?? 0;
        });
        this.splitMode = 'custom';
      },
      error: () => this.toastService.errorToast('Failed to load expense'),
    });
  }

  nextStep(): void {
    if (this.currentStep === 1) {
      if (this.form.invalid) {
        this.form.markAllAsTouched();
        return;
      }
      this.initDefaultPayer();
      if (this.paidByMode === 'equal') {
        this.dividePayersEqually();
      }
      this.recalculateEqualSplit();
    }
    if (this.currentStep === 2 && !this.paidByValid) {
      return;
    }
    if (this.currentStep < this.stepsCount) {
      this.currentStep++;
    }
  }

  private initDefaultPayer(): void {
    const user = this.tokenStorage.user();

    if (!user) return;

    const myEntry = this.paidByEntries.find((e) => e.userId === user.id);

    if (!myEntry) return;

    // Only pre-select if the user hasn't already made a selection
    if (this.paidByEntries.some((e) => e.selected)) return;

    myEntry.selected = true;
    myEntry.amount = this.totalAmount;
  }

  prevStep(): void {
    if (this.currentStep <= 1) return;

    this.currentStep--;
  }

  togglePayer(entry: MemberEntry): void {
    entry.selected = !entry.selected;

    if (!entry.selected) entry.amount = 0;

    if (this.paidByMode === 'equal') this.dividePayersEqually();
    else {
      const selected = this.paidByEntries.filter((e) => e.selected);

      if (selected.length === 1) selected[0].amount = this.totalAmount;
    }
  }

  setPaidByMode(mode: 'equal' | 'custom'): void {
    this.paidByMode = mode;
    if (mode !== 'equal') return;

    this.dividePayersEqually();
  }

  private dividePayersEqually(): void {
    const selected = this.paidByEntries.filter((e) => e.selected);

    if (!selected.length) return;

    const amounts = splitEqually(this.totalAmount, selected.length);
    selected.forEach((e, i) => (e.amount = amounts[i]));
  }

  onPayerAmountChange(entry: MemberEntry, value: string | null | undefined): void {
    entry.amount = Math.max(0, parseFloat(value ?? '0') || 0);
  }

  toggleSplitter(entry: MemberEntry): void {
    entry.selected = !entry.selected;
    if (this.splitMode === 'equal') this.recalculateEqualSplit();
    else if (!entry.selected) entry.amount = 0;
  }

  setSplitMode(mode: 'equal' | 'custom'): void {
    this.splitMode = mode;

    if (mode !== 'equal') return;

    this.recalculateEqualSplit();
  }

  onSplitterAmountChange(entry: MemberEntry, value: string | null | undefined): void {
    entry.amount = Math.max(0, parseFloat(value ?? '0') || 0);
  }

  private recalculateEqualSplit(): void {
    const selected = this.splitEntries.filter((e) => e.selected);

    if (!selected.length) return;

    const amounts = splitEqually(this.totalAmount, selected.length);
    selected.forEach((e, i) => (e.amount = amounts[i]));
    this.splitEntries.filter((e) => !e.selected).forEach((e) => (e.amount = 0));
  }

  submit(): void {
    if (!this.splitValid) return;

    const basePayload: CreateExpenseRequest = {
      description: this.form.value.description!,
      expenseDate: this.form.value.expenseDate!,
      totalAmount: this.totalAmount,
      payments: this.paidByEntries
        .filter((e) => e.selected && e.amount > 0)
        .map((e) => ({ memberId: e.memberId, amount: e.amount })),
      splits: this.splitEntries
        .filter((e) => e.selected && e.amount > 0)
        .map((e) => ({ memberId: e.memberId, amount: e.amount })),
    };

    this.uiService.itemLoading.set(true);

    const onError = (err: { error?: { message?: string } }) => {
      this.uiService.itemLoading.set(false);
      this.toastService.errorToast(err?.error?.message ?? 'Failed to save expense');
    };

    if (this.pendingMode) {
      this.expenseFacade
        .updatePendingExpense(this.pendingTempId, this.groupId, basePayload)
        .subscribe({
          next: () => {
            this.uiService.itemLoading.set(false);
            this.toastService.successToast('Pending expense updated');
            this.router.navigate(['groups', this.groupId, 'details']);
          },
          error: onError,
        });
    } else if (this.editMode) {
      const onSuccess = () => {
        this.uiService.itemLoading.set(false);
        this.toastService.successToast('Expense updated!');
        this.router.navigate(['groups', this.groupId, 'expenses', this.expenseId, 'details']);
      };
      // The legacy service does not touch the cache, so drop it explicitly —
      // otherwise the list would keep serving the pre-edit rows.
      this.expenseService
        .updateExpense(this.groupId, { ...basePayload, id: this.expenseId })
        .pipe(concatMap(() => this.expenseFacade.refreshExpenses(this.groupId)))
        .subscribe({ next: onSuccess, error: onError });
    } else {
      this.expenseFacade.createExpense(this.groupId, basePayload).subscribe({
        next: ({ queued }) => {
          this.uiService.itemLoading.set(false);
          this.toastService.successToast(
            queued ? 'Expense saved offline, will sync when connected' : 'Expense added!',
          );
          this.router.navigate(['groups', this.groupId, 'details']);
        },
        error: onError,
      });
    }
  }
}
