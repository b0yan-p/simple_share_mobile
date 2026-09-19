import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonFooter,
  IonHeader,
  IonIcon,
  IonInput,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonTitle,
  IonToolbar,
  NavController,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { alertCircleOutline, checkmarkCircle } from 'ionicons/icons';
import { UiService } from 'src/app/core/services/ui.service';
import { AvatarComponent } from 'src/app/shared/components/avatar/avatar.component';
import {
  Allocation,
  AllocationEntry,
  AllocationKind,
  AllocationMode,
  expensePath,
} from '../../models/expense-draft.model';
import {
  allocatedMinor,
  distribute,
  ExpenseDraftStore,
} from '../../services/expense-draft.store';
import { CURRENCY } from '../../utils/expense.constants';
import { fromMinor, toMinor } from '../../utils/money.util';

/**
 * Editor for one of the two allocations of the expense draft — "Who paid" and
 * "Split between" are the same interaction (pick members, share out the total),
 * so they are one component behind two routes rather than two near-copies.
 *
 * It never talks to the API: `Done` commits into the draft, and leaving any
 * other way discards this visit's edits.
 */
@Component({
  selector: 'app-expense-allocation',
  templateUrl: './expense-allocation.component.html',
  styleUrls: ['./expense-allocation.component.scss'],
  imports: [
    DecimalPipe,
    AvatarComponent,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonButton,
    IonTitle,
    IonContent,
    IonFooter,
    IonInput,
    IonIcon,
    IonSegment,
    IonSegmentButton,
    IonLabel,
  ],
})
export class ExpenseAllocationComponent implements ViewWillEnter {
  private readonly route = inject(ActivatedRoute);
  private readonly navController = inject(NavController);
  private readonly store = inject(ExpenseDraftStore);
  private readonly ui = inject(UiService);

  readonly currency = CURRENCY;
  readonly kind = signal<AllocationKind>('payers');
  readonly mode = signal<AllocationMode>('equal');
  readonly entries = signal<AllocationEntry[]>([]);

  readonly totalMinor = this.store.totalMinor;

  readonly isPayers = computed(() => this.kind() === 'payers');
  readonly title = computed(() => (this.isPayers() ? 'Who paid?' : 'Split between'));
  readonly totalLabel = computed(() => (this.isPayers() ? 'Paid' : 'Split'));

  readonly assignedMinor = computed(() =>
    allocatedMinor({ mode: this.mode(), modified: true, entries: this.entries() }),
  );
  readonly selectedCount = computed(() => this.entries().filter((e) => e.selected).length);
  readonly hasContributor = computed(() =>
    this.entries().some((e) => e.selected && e.amountMinor > 0),
  );
  readonly hasNegative = computed(() => this.entries().some((e) => e.amountMinor < 0));
  readonly differenceMinor = computed(() => this.totalMinor() - this.assignedMinor());

  /** Mirrors the acceptance rules for `Done`: someone pays, and it adds up. */
  readonly canSubmit = computed(
    () =>
      this.selectedCount() > 0 &&
      this.hasContributor() &&
      !this.hasNegative() &&
      this.differenceMinor() === 0,
  );

  private expenseUrl: string[] = [];

  constructor() {
    addIcons({ alertCircleOutline, checkmarkCircle });
  }

  ionViewWillEnter(): void {
    this.ui.tabBarVisible.set(false);

    const params = this.route.snapshot.params;
    const groupId = params['id'];
    this.kind.set(this.route.snapshot.data['kind'] as AllocationKind);
    this.expenseUrl = expensePath(groupId, {
      expenseId: params['expenseId'],
      pendingId: params['pendingId'],
    });

    // No draft means the page was opened directly (deep link or reload) and the
    // total we would edit against is gone — send the user back to compose it.
    if (!this.store.draft()) {
      this.navController.navigateBack(this.expenseUrl);
      return;
    }

    const allocation = this.isPayers() ? this.store.payers() : this.store.splits();
    this.mode.set(allocation.mode);
    this.entries.set(allocation.entries.map((entry) => ({ ...entry })));
  }

  /** Minor units as a major-unit number, for the `number` pipe. */
  major(minor: number): number {
    return fromMinor(minor);
  }

  /** Major-unit value for the amount inputs. */
  amountOf(entry: AllocationEntry): number {
    return fromMinor(entry.amountMinor);
  }

  setMode(mode: AllocationMode): void {
    this.mode.set(mode);
    if (mode === 'equal') this.redistribute();
  }

  toggle(entry: AllocationEntry): void {
    this.patch(entry.memberId, (current) => ({
      ...current,
      selected: !current.selected,
      amountMinor: current.selected ? 0 : current.amountMinor,
    }));

    if (this.mode() === 'equal') this.redistribute();
    else this.assignSoleContributor();
  }

  onAmountInput(entry: AllocationEntry, value: string | number | null | undefined): void {
    const amountMinor = Math.max(0, toMinor(Number(value ?? 0)));
    this.patch(entry.memberId, (current) => ({ ...current, amountMinor }));
  }

  done(): void {
    if (!this.canSubmit()) return;

    const allocation: Allocation = {
      mode: this.mode(),
      modified: true,
      entries: this.entries(),
    };
    this.store.commit(this.kind(), allocation);
    this.navController.navigateBack(this.expenseUrl);
  }

  /** Back target for the header button — the Add/Edit Expense page. */
  get backHref(): string {
    return this.expenseUrl.join('/');
  }

  private redistribute(): void {
    const allocation = distribute(
      { mode: 'equal', modified: true, entries: this.entries() },
      this.totalMinor(),
    );
    this.entries.set(allocation.entries);
  }

  /** A single selected member in custom mode always owes/paid the whole total. */
  private assignSoleContributor(): void {
    const selected = this.entries().filter((e) => e.selected);

    if (selected.length !== 1) return;

    this.patch(selected[0].memberId, (current) => ({
      ...current,
      amountMinor: this.totalMinor(),
    }));
  }

  private patch(memberId: string, update: (entry: AllocationEntry) => AllocationEntry): void {
    this.entries.update((entries) =>
      entries.map((entry) => (entry.memberId === memberId ? update(entry) : entry)),
    );
  }
}
