import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
  IonModal,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ViewDidEnter,
  ViewWillEnter,
  ViewWillLeave,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  calendarOutline,
  chevronDownOutline,
  chevronForwardOutline,
  closeCircle,
  cloudOfflineOutline,
  informationCircleOutline,
  peopleOutline,
  receiptOutline,
  timeOutline,
  walletOutline,
} from 'ionicons/icons';
import { concatMap, first, from } from 'rxjs';
import { ToastService } from 'src/app/core/services/toast.service';
import { UiService } from 'src/app/core/services/ui.service';
import { GroupMember } from 'src/app/features/groups/models/group-member.model';
import { GroupMemberFacade } from 'src/app/features/groups/services/group-member-facade.service';
import { EmptyStateComponent } from 'src/app/shared/components/empty-state/empty-state.component';
import { CreateExpenseRequest } from '../../models/create-expense.model';
import { AllocationKind, draftKey, expensePath } from '../../models/expense-draft.model';
import { ExpenseDraftStore } from '../../services/expense-draft.store';
import { ExpenseFacade } from '../../services/expense-facade.service';
import { ExpenseService } from '../../services/expense.service';
import {
  AMOUNT_MAX,
  AMOUNT_MIN,
  CURRENCY,
  DESCRIPTION_MAX_LENGTH,
} from '../../utils/expense.constants';
import { fromMinor, toMinor } from '../../utils/money.util';

/**
 * Add / Edit Expense. The page owns the whole expense draft: amount, description
 * and date are edited here, payer and split configuration are edited on their own
 * screens and committed back into the same draft. Nothing reaches the API until
 * `Save Expense`.
 */
@Component({
  selector: 'app-expense-item',
  templateUrl: './expense-item.component.html',
  styleUrls: ['./expense-item.component.scss'],
  imports: [
    DatePipe,
    DecimalPipe,
    ReactiveFormsModule,
    EmptyStateComponent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonTitle,
    IonContent,
    IonFooter,
    IonInput,
    IonModal,
    IonDatetime,
    IonIcon,
    IonSpinner,
  ],
})
export class ExpenseItemComponent implements ViewDidEnter, ViewWillEnter, ViewWillLeave {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly expenseService = inject(ExpenseService);
  private readonly expenseFacade = inject(ExpenseFacade);
  private readonly toastService = inject(ToastService);
  private readonly groupMemberFacade = inject(GroupMemberFacade);
  readonly draftStore = inject(ExpenseDraftStore);
  readonly uiService = inject(UiService);

  readonly currency = CURRENCY;
  readonly amountMax = AMOUNT_MAX;
  readonly descriptionMaxLength = DESCRIPTION_MAX_LENGTH;

  groupId = '';
  editMode = false;
  expenseId = '';
  pendingMode = false;
  pendingTempId = '';

  /** Members could not be loaded from either the network or the cache. */
  readonly membersError = signal(false);
  /** One save request at a time — guards against double taps on the CTA. */
  readonly saving = signal(false);

  private readonly formValid = signal(false);
  /** Bumped whenever control state changes, so template guards stay reactive. */
  private readonly formTick = signal(0);
  readonly descriptionFocused = signal(false);

  private readonly amountInput = viewChild<IonInput>('amountInput');
  /** A fresh expense opens with the keyboard up; a returning one must not. */
  private focusAmountOnEnter = false;
  /** Set just before opening an editor screen so leaving does not drop the draft. */
  private navigatingToEditor = false;

  readonly form = new FormGroup({
    totalAmount: new FormControl<number | null>(null, [
      Validators.required,
      Validators.min(AMOUNT_MIN),
      Validators.max(AMOUNT_MAX),
    ]),
    description: new FormControl<string>('', [
      Validators.required,
      Validators.maxLength(DESCRIPTION_MAX_LENGTH),
    ]),
    expenseDate: new FormControl<string | null>(new Date().toISOString(), [
      Validators.required,
    ]),
  });

  readonly totalMinor = this.draftStore.totalMinor;
  readonly paidByRow = this.draftStore.paidByRow;
  readonly splitRow = this.draftStore.splitRow;
  readonly summary = this.draftStore.summary;

  /** Allocations are only worth complaining about once there is an amount. */
  readonly payerError = computed(() => this.totalMinor() > 0 && !this.draftStore.payerValid());
  readonly splitError = computed(() => this.totalMinor() > 0 && !this.draftStore.splitValid());

  readonly canSave = computed(
    () =>
      this.formValid() &&
      this.draftStore.payerValid() &&
      this.draftStore.splitValid() &&
      !this.saving(),
  );

  /** Inline description error, shown only once the user has engaged with it. */
  readonly descriptionError = computed(() => {
    this.formTick();
    const control = this.form.controls.description;

    return control.invalid && (control.touched || control.dirty);
  });

  readonly saveLabel = computed(() =>
    this.pendingMode ? 'Update Pending' : this.editMode ? 'Update Expense' : 'Save Expense',
  );

  readonly title = computed(() =>
    this.pendingMode ? 'Edit Pending' : this.editMode ? 'Edit Expense' : 'Add Expense',
  );

  constructor() {
    addIcons({
      alertCircleOutline,
      calendarOutline,
      chevronDownOutline,
      chevronForwardOutline,
      closeCircle,
      cloudOfflineOutline,
      informationCircleOutline,
      peopleOutline,
      receiptOutline,
      timeOutline,
      walletOutline,
    });

    this.form.controls.totalAmount.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((amount) => this.draftStore.setTotalMinor(toMinor(amount)));

    this.form.controls.description.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((description) =>
        this.draftStore.patchDetails({ description: description ?? '' }),
      );

    this.form.controls.expenseDate.valueChanges
      .pipe(takeUntilDestroyed())
      .subscribe((expenseDate) =>
        this.draftStore.patchDetails({ expenseDate: expenseDate ?? new Date().toISOString() }),
      );

    this.form.statusChanges.pipe(takeUntilDestroyed()).subscribe(() => {
      this.formValid.set(this.form.valid);
      this.formTick.update((tick) => tick + 1);
    });
  }

  ionViewWillEnter(): void {
    // Focused flow: hide the bottom tab bar so only the pinned CTA shows.
    this.uiService.tabBarVisible.set(false);
    this.navigatingToEditor = false;
    this.saving.set(false);

    const params = this.route.snapshot.params;
    this.groupId = params['id'];
    this.expenseId = params['expenseId'] ?? '';
    this.pendingTempId = params['pendingId'] ?? '';
    this.editMode = !!this.expenseId;
    this.pendingMode = !!this.pendingTempId;

    // Returning from the payer / split editor — the draft (and therefore the
    // members and the amounts) is already in place, so leave it alone.
    if (this.draftStore.isFor(this.currentDraftKey())) {
      this.focusAmountOnEnter = false;
      this.syncFormFromDraft();
      return;
    }

    this.focusAmountOnEnter = !this.editMode && !this.pendingMode;

    this.draftStore.clear();
    this.form.reset({ expenseDate: new Date().toISOString() });
    this.formValid.set(this.form.valid);
    this.formTick.update((tick) => tick + 1);
    this.loadMembers();
  }

  /**
   * Ionic fires this once the page transition has finished, which is the point
   * the input is mounted and actually focusable — no setTimeout guessing at how
   * long the animation takes.
   */
  ionViewDidEnter(): void {
    if (!this.focusAmountOnEnter) return;

    this.focusAmountOnEnter = false;
    const input = this.amountInput();

    if (!input) return;

    from(input.setFocus()).pipe(first()).subscribe();
  }

  ionViewWillLeave(): void {
    // Restore the tab bar for the rest of the app.
    this.uiService.tabBarVisible.set(true);

    // Anything other than a hop to an editor screen ends the flow: drop the
    // draft so the next expense never starts from stale data.
    if (!this.navigatingToEditor) this.draftStore.clear();
  }

  /**
   * Public so the empty state can retry. The facade is network-first with a
   * cache fallback, which this screen used to reimplement without the fallback.
   */
  loadMembers(): void {
    this.membersError.set(false);

    this.groupMemberFacade.getGroupMembers(this.groupId).subscribe({
      next: (members) => {
        const key = this.currentDraftKey();

        if (this.pendingMode) this.loadPendingExpenseData(key, members);
        else if (this.editMode) this.loadExpenseData(key, members);
        else this.draftStore.start(key, this.groupId, members);

        this.syncFormFromDraft();
      },
      // An inline state rather than a redirect: router.navigate() from the async
      // tail of ionViewWillEnter races the Ionic transition and can be dropped,
      // which left the user on a page with no members and no explanation.
      error: () => this.membersError.set(true),
    });
  }

  openPayers(): void {
    this.openEditor('payers');
  }

  openSplit(): void {
    this.openEditor('splits');
  }

  /** Minor units as a major-unit number, for the `number` pipe. */
  major(minor: number): number {
    return fromMinor(minor);
  }

  /** Clears the description without giving the row a second tap target. */
  clearDescription(): void {
    this.form.controls.description.setValue('');
    this.form.controls.description.markAsTouched();
    this.formTick.update((tick) => tick + 1);
  }

  submit(): void {
    if (!this.canSave()) return;

    const draft = this.draftStore.draft();

    if (!draft) return;

    this.saving.set(true);
    this.uiService.itemLoading.set(true);

    const basePayload: CreateExpenseRequest = {
      description: draft.description,
      expenseDate: draft.expenseDate,
      totalAmount: fromMinor(draft.totalMinor),
      payments: toMemberAmounts(draft.payers.entries),
      splits: toMemberAmounts(draft.splits.entries),
    };

    const onError = (err: { error?: { message?: string } }) => {
      // The draft is deliberately left intact so the user can retry.
      this.saving.set(false);
      this.uiService.itemLoading.set(false);
      this.toastService.errorToast(err?.error?.message ?? 'Failed to save expense');
    };

    if (this.pendingMode) {
      this.expenseFacade
        .updatePendingExpense(this.pendingTempId, this.groupId, basePayload)
        .subscribe({
          next: () => {
            this.finishSave('Pending expense updated');
            this.router.navigate(['groups', this.groupId, 'details']);
          },
          error: onError,
        });
    } else if (this.editMode) {
      // The legacy service does not touch the cache, so drop it explicitly —
      // otherwise the list would keep serving the pre-edit rows.
      this.expenseService
        .updateExpense(this.groupId, { ...basePayload, id: this.expenseId })
        .pipe(concatMap(() => this.expenseFacade.refreshExpenses(this.groupId)))
        .subscribe({
          next: () => {
            this.finishSave('Expense updated!');
            this.router.navigate([
              'groups',
              this.groupId,
              'expenses',
              this.expenseId,
              'details',
            ]);
          },
          error: onError,
        });
    } else {
      this.expenseFacade.createExpense(this.groupId, basePayload).subscribe({
        next: ({ queued }) => {
          this.finishSave(
            queued ? 'Expense saved offline, will sync when connected' : 'Expense added!',
          );
          this.router.navigate(['groups', this.groupId, 'details']);
        },
        error: onError,
      });
    }
  }

  private finishSave(message: string): void {
    this.saving.set(false);
    this.uiService.itemLoading.set(false);
    this.draftStore.clear();
    this.toastService.successToast(message);
  }

  private openEditor(kind: AllocationKind): void {
    if (!this.draftStore.draft()) return;

    this.navigatingToEditor = true;
    this.router.navigate([
      ...expensePath(this.groupId, {
        expenseId: this.expenseId,
        pendingId: this.pendingTempId,
      }),
      kind === 'payers' ? 'payers' : 'split',
    ]);
  }

  private currentDraftKey(): string {
    return draftKey(this.groupId, {
      expenseId: this.expenseId,
      pendingId: this.pendingTempId,
    });
  }

  private syncFormFromDraft(): void {
    const draft = this.draftStore.draft();

    if (!draft) return;

    this.form.patchValue(
      {
        totalAmount: draft.totalMinor ? fromMinor(draft.totalMinor) : null,
        description: draft.description,
        expenseDate: draft.expenseDate,
      },
      { emitEvent: false },
    );
    this.form.updateValueAndValidity({ emitEvent: false });
    this.formValid.set(this.form.valid);
  }

  private loadPendingExpenseData(key: string, members: GroupMember[]): void {
    this.expenseFacade.getPendingExpense(this.pendingTempId).subscribe({
      next: (pending) => {
        if (!pending) return;

        this.draftStore.hydrate(key, this.groupId, members, {
          description: pending.payload.description,
          expenseDate: pending.payload.expenseDate,
          totalAmount: pending.payload.totalAmount,
          payments: pending.payload.payments,
          splits: pending.payload.splits,
        });
        this.syncFormFromDraft();
      },
      error: () => this.toastService.errorToast('Failed to load pending expense'),
    });
  }

  private loadExpenseData(key: string, members: GroupMember[]): void {
    this.expenseService.getExpense(this.groupId, this.expenseId).subscribe({
      next: (expense) => {
        this.draftStore.hydrate(key, this.groupId, members, {
          description: expense.description,
          expenseDate: expense.expenseDate,
          totalAmount: expense.amount,
          payments: expense.paidBy,
          splits: expense.splittedBy,
        });
        this.syncFormFromDraft();
      },
      error: () => this.toastService.errorToast('Failed to load expense'),
    });
  }
}

function toMemberAmounts(
  entries: readonly { memberId: string; selected: boolean; amountMinor: number }[],
) {
  return entries
    .filter((entry) => entry.selected && entry.amountMinor > 0)
    .map((entry) => ({ memberId: entry.memberId, amount: fromMinor(entry.amountMinor) }));
}
