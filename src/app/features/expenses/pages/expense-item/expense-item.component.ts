import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
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
} from '@ionic/angular/standalone';
import { TokenStorageService } from 'src/app/auth/services/token-storage.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { UiService } from 'src/app/core/services/ui.service';
import { GroupMember } from 'src/app/features/groups/models/group-member.model';
import { GroupService } from 'src/app/features/groups/services/group.service';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import { CreateExpenseRequest } from '../../models/create-expense.model';
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
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonTitle,
    IonContent,
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
export class ExpenseItemComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private groupService = inject(GroupService);
  private expenseService = inject(ExpenseService);
  private toastService = inject(ToastService);
  private tokenStorage = inject(TokenStorageService);
  uiService = inject(UiService);

  readonly currency = CURRENCY;
  readonly stepsCount = 3;
  currentStep = 1;
  groupId = '';

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

  ngOnInit(): void {
    this.groupId = this.route.snapshot.params['id'];
    this.loadMembers();
  }

  private loadMembers(): void {
    this.groupService.getGroupMembers(this.groupId).subscribe({
      next: (members) => {
        this.paidByEntries = members.map((m) => ({ ...m, selected: false, amount: 0 }));
        this.splitEntries = members.map((m) => ({ ...m, selected: true, amount: 0 }));
        this.recalculateEqualSplit();
      },
      error: () => this.toastService.errorToast('Failed to load group members'),
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

    const myEntry = this.paidByEntries.find((e) => e.displayName === user.fullName);

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

    const payload: CreateExpenseRequest = {
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
    this.expenseService.createExpense(this.groupId, payload).subscribe({
      next: () => {
        this.uiService.itemLoading.set(false);
        this.toastService.successToast('Expense added!');
        this.router.navigate(['groups', this.groupId, 'details']);
      },
      error: (err) => {
        this.uiService.itemLoading.set(false);
        this.toastService.errorToast(err?.error?.message ?? 'Failed to save expense');
      },
    });
  }
}
