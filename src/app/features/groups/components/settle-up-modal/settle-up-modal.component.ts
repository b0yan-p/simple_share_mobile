import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, Input, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonSpinner,
  IonToolbar,
  ModalController,
} from '@ionic/angular/standalone';
import { startWith } from 'rxjs';
import { ExpenseService } from 'src/app/features/expenses/services/expense.service';

@Component({
  selector: 'app-settle-up-modal',
  templateUrl: './settle-up-modal.component.html',
  styleUrls: ['./settle-up-modal.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonButton,
    IonContent,
    IonInput,
    IonIcon,
    IonSpinner,
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

  private modalController = inject(ModalController);
  private expenseService = inject(ExpenseService);

  submitting = false;
  error = false;
  fromInitials = '';
  toInitials = '';

  form = new FormGroup({
    amount: new FormControl<number | null>(null, [Validators.required, Validators.min(0.01)]),
    date: new FormControl<string>(new Date().toISOString().split('T')[0], [
      Validators.required,
    ]),
  });

  private amountValue = toSignal(this.form.controls.amount.valueChanges.pipe(startWith(null)));

  liveAmount = computed(() => this.amountValue() ?? this.defaultAmount ?? 0);

  ngOnInit(): void {
    this.form.patchValue({ amount: this.defaultAmount });
    this.fromInitials = this.fromLabel
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
    this.toInitials = this.toLabel
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  }

  dismiss(): void {
    this.modalController.dismiss(null, 'cancel');
  }

  submit(): void {
    if (this.form.invalid || this.submitting) return;
    this.submitting = true;
    this.error = false;

    const { amount, date } = this.form.value;
    this.expenseService
      .settleUp(this.groupId, {
        fromMemberId: this.fromMemberId,
        toMemberId: this.toMemberId,
        amount: amount!,
        date: new Date(date!).toISOString(),
      })
      .subscribe({
        next: () => {
          this.submitting = false;
          this.modalController.dismiss({ success: true }, 'confirm');
        },
        error: () => {
          this.submitting = false;
          this.error = true;
        },
      });
  }
}
