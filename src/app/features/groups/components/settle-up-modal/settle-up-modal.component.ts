import { AMOUNT_MAX } from 'src/app/features/expenses/utils/expense.constants';
import { hasTwoDecimalPrecision } from 'src/app/features/expenses/utils/money.util';
import { localCalendarDate } from 'src/app/shared/utils/calendar-date';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject, Input, OnInit, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonDatetime,
  IonHeader,
  IonIcon,
  IonInput,
  IonModal,
  IonSpinner,
  IonTitle,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  alertCircleOutline,
  arrowBackOutline,
  calendarOutline,
  checkmarkCircle,
  chevronForwardOutline,
  closeOutline,
  informationCircleOutline,
} from 'ionicons/icons';
import { catchError, concatMap, of, startWith } from 'rxjs';
import { ExpenseFacade } from 'src/app/features/expenses/services/expense-facade.service';
import { ExpenseService } from 'src/app/features/expenses/services/expense.service';
import { fromMinor, toMinor } from 'src/app/features/expenses/utils/money.util';

/** How the entered amount relates to the outstanding balance. */
type AmountState =
  'missing' | 'nonPositive' | 'exceeds' | 'settles' | 'partial' | 'limit' | 'precision';

@Component({
  selector: 'app-settle-up-modal',
  templateUrl: './settle-up-modal.component.html',
  styleUrls: ['./settle-up-modal.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe,
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonContent,
    IonInput,
    IonModal,
    IonDatetime,
    IonIcon,
    IonSpinner,
    IonTitle,
  ],
})
export class SettleUpModalComponent implements OnInit {
  @Input({ required: true }) fromMemberId!: string;
  @Input({ required: true }) toMemberId!: string;
  @Input({ required: true }) fromLabel!: string;
  @Input({ required: true }) toLabel!: string;
  @Input() fromIsCurrentUser = false;
  @Input() toIsCurrentUser = false;
  @Input({ required: true }) defaultAmount!: number;
  @Input({ required: true }) groupId!: string;
  @Input() showBack = false;
  readonly back = output<void>();
  readonly submittingChange = output<boolean>();

  private modalController = inject(ModalController);
  private expenseService = inject(ExpenseService);
  private expenseFacade = inject(ExpenseFacade);

  @Input({ required: true }) currency!: string;
  readonly maxDate = localCalendarDate();
  readonly amountMax = AMOUNT_MAX;

  submitting = false;
  error = false;
  fromInitials = '';
  toInitials = '';
  /** "You pay Marinko R." — built from the labels the opener already resolved. */
  directionText = '';
  /** "You'll still owe" — the amount is appended in the template. */
  remainingOwedPrefix = '';

  /** The outstanding balance, in integer minor units. Money never compares as float. */
  private readonly outstandingMinor = signal(0);
  readonly outstandingAmount = computed(() =>
    fromMinor(this.outstandingMinor(), this.currency),
  );

  form = new FormGroup({
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    date: new FormControl<string>(localCalendarDate(), [Validators.required]),
  });

  private amountValue = toSignal(this.form.controls.amount.valueChanges.pipe(startWith(null)), {
    initialValue: null,
  });

  /** Entered amount in minor units, or null when empty / malformed. */
  private readonly amountMinor = computed(() => {
    const value = this.amountValue();
    if (value == null || !Number.isFinite(value)) return null;

    return toMinor(value, this.currency);
  });

  readonly amountState = computed<AmountState>(() => {
    const value = this.amountValue();
    if (value != null && value > AMOUNT_MAX) return 'limit';
    if (value != null && !hasTwoDecimalPrecision(value)) return 'precision';
    const minor = this.amountMinor();
    if (minor == null) return 'missing';
    if (minor <= 0) return 'nonPositive';
    if (minor > this.outstandingMinor()) return 'exceeds';

    return minor === this.outstandingMinor() ? 'settles' : 'partial';
  });

  /** What is left to settle after this payment, in major units. */
  readonly remainingAmount = computed(() =>
    fromMinor(this.outstandingMinor() - (this.amountMinor() ?? 0), this.currency),
  );

  /** Signal-only so it always re-evaluates; the date is required and pre-filled. */
  readonly canSubmit = computed(
    () => this.amountState() === 'settles' || this.amountState() === 'partial',
  );

  constructor() {
    addIcons({
      alertCircleOutline,
      arrowBackOutline,
      calendarOutline,
      checkmarkCircle,
      chevronForwardOutline,
      closeOutline,
      informationCircleOutline,
    });
  }

  ngOnInit(): void {
    this.outstandingMinor.set(toMinor(this.defaultAmount, this.currency));

    this.form.controls.amount.addValidators((control) => {
      const value = control.value as number | null;
      if (value == null || !Number.isFinite(value)) return null;

      return toMinor(value, this.currency) > this.outstandingMinor()
        ? { exceedsOutstanding: true }
        : null;
    });

    this.form.patchValue({ amount: Math.min(this.defaultAmount, AMOUNT_MAX) });

    this.fromInitials = this.initialsOf(this.fromLabel);
    this.toInitials = this.initialsOf(this.toLabel);
    this.directionText = this.fromIsCurrentUser
      ? `You pay ${this.toLabel}`
      : this.toIsCurrentUser
        ? `${this.fromLabel} pays you`
        : `${this.fromLabel} pays ${this.toLabel}`;
    this.remainingOwedPrefix = this.fromIsCurrentUser
      ? `You'll still owe ${this.toLabel}`
      : this.toIsCurrentUser
        ? `${this.fromLabel} will still owe you`
        : `${this.fromLabel} will still owe ${this.toLabel}`;
  }

  /** Restores the full outstanding balance into the amount field. */
  payFullAmount(): void {
    this.form.controls.amount.setValue(Math.min(this.outstandingAmount(), AMOUNT_MAX));
  }

  dismiss(): void {
    this.modalController.dismiss(null, 'cancel');
  }

  submit(): void {
    if (this.form.invalid || !this.canSubmit() || this.submitting) return;
    this.submitting = true;
    this.submittingChange.emit(true);
    this.error = false;

    const { amount, date } = this.form.value;
    this.expenseService
      .settleUp(this.groupId, {
        fromMemberId: this.fromMemberId,
        toMemberId: this.toMemberId,
        amount: amount!,
        date: date!.slice(0, 10),
      })
      .pipe(
        concatMap(() =>
          this.expenseFacade.refreshExpenses(this.groupId).pipe(
            catchError((error) => {
              console.warn('[API ERROR] refreshing expenses after settlement', error);
              return of(void 0);
            }),
          ),
        ),
      )
      .subscribe({
        next: () => {
          this.submitting = false;
          this.submittingChange.emit(false);
          this.modalController.dismiss({ success: true }, 'confirm');
        },
        error: () => {
          this.submitting = false;
          this.submittingChange.emit(false);
          this.error = true;
        },
      });
  }

  private initialsOf(label: string): string {
    return label
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }
}
