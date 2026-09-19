import { computed, inject, Injectable, signal } from '@angular/core';
import { TokenStorageService } from 'src/app/auth/services/token-storage.service';
import { GroupMember } from 'src/app/features/groups/models/group-member.model';
import { MemberAmountEntry } from '../models/create-expense.model';
import {
  Allocation,
  AllocationEntry,
  AllocationKind,
  ExpenseDraft,
} from '../models/expense-draft.model';
import { CURRENCY } from '../utils/expense.constants';
import {
  payerRowDisplay,
  RowDisplay,
  splitRowDisplay,
  summarySentence,
} from '../utils/expense-display.util';
import { splitEquallyMinor, sumMinor, toMinor } from '../utils/money.util';

const EMPTY_ALLOCATION: Allocation = { mode: 'equal', modified: false, entries: [] };

/**
 * Holds the expense being composed. The Add Expense page owns the draft; the
 * payer and split screens edit a copy of one allocation and commit it back, so
 * abandoning an editor screen cannot leak half-finished amounts into the page.
 *
 * Root-provided rather than route-scoped because the editor screens are
 * siblings, not children, of the Add Expense route — there is no shared
 * injector to scope it to. Lifetime is managed explicitly via `clear()`.
 */
@Injectable({ providedIn: 'root' })
export class ExpenseDraftStore {
  private readonly tokenStorage = inject(TokenStorageService);

  private readonly state = signal<ExpenseDraft | null>(null);

  readonly draft = this.state.asReadonly();
  readonly currentUserId = computed(() => this.tokenStorage.user()?.id ?? null);

  readonly currency = computed(() => this.state()?.currency ?? CURRENCY);
  readonly totalMinor = computed(() => this.state()?.totalMinor ?? 0);
  readonly payers = computed(() => this.state()?.payers ?? EMPTY_ALLOCATION);
  readonly splits = computed(() => this.state()?.splits ?? EMPTY_ALLOCATION);

  readonly payerTotalMinor = computed(() => allocatedMinor(this.payers()));
  readonly splitTotalMinor = computed(() => allocatedMinor(this.splits()));

  readonly payerValid = computed(
    () => this.totalMinor() > 0 && this.payerTotalMinor() === this.totalMinor(),
  );
  readonly splitValid = computed(
    () => this.totalMinor() > 0 && this.splitTotalMinor() === this.totalMinor(),
  );

  readonly paidByRow = computed<RowDisplay>(() =>
    payerRowDisplay(this.payers(), this.currentUserId()),
  );
  readonly splitRow = computed<RowDisplay>(() => splitRowDisplay(this.splits()));
  readonly summary = computed(() =>
    summarySentence(this.payers(), this.splits(), this.currentUserId()),
  );

  /** True when a draft for exactly this expense is already in flight. */
  isFor(key: string): boolean {
    return this.state()?.key === key;
  }

  /**
   * Starts a brand-new expense: the current user pays everything, and everyone
   * in the group splits it equally.
   */
  start(key: string, groupId: string, members: GroupMember[]): void {
    const currentUserId = this.currentUserId();

    const payers: Allocation = {
      mode: 'equal',
      modified: false,
      entries: members.map((member) => ({
        ...toEntry(member),
        selected: currentUserId !== null && member.userId === currentUserId,
      })),
    };

    const splits: Allocation = {
      mode: 'equal',
      modified: false,
      entries: members.map((member) => ({ ...toEntry(member), selected: true })),
    };

    this.state.set({
      key,
      groupId,
      currency: CURRENCY,
      description: '',
      expenseDate: new Date().toISOString(),
      totalMinor: 0,
      payers: distribute(payers, 0),
      splits: distribute(splits, 0),
    });
  }

  /** Loads an existing (or queued) expense into the draft for editing. */
  hydrate(
    key: string,
    groupId: string,
    members: GroupMember[],
    expense: {
      description: string;
      expenseDate: string;
      totalAmount: number;
      payments: MemberAmountEntry[];
      splits: MemberAmountEntry[];
    },
  ): void {
    const totalMinor = toMinor(expense.totalAmount);

    this.state.set({
      key,
      groupId,
      currency: CURRENCY,
      description: expense.description,
      expenseDate: expense.expenseDate,
      totalMinor,
      payers: fromPersisted(members, expense.payments, totalMinor),
      splits: fromPersisted(members, expense.splits, totalMinor),
    });
  }

  patchDetails(details: Partial<Pick<ExpenseDraft, 'description' | 'expenseDate'>>): void {
    this.state.update((draft) => (draft ? { ...draft, ...details } : draft));
  }

  /**
   * Re-applies the allocations the user has not taken over. Equal allocations
   * follow the new total; amounts the user typed are left exactly as they are
   * and simply stop validating until they match again.
   */
  setTotalMinor(totalMinor: number): void {
    this.state.update((draft) => {
      if (!draft || draft.totalMinor === totalMinor) return draft;

      return {
        ...draft,
        totalMinor,
        payers: draft.payers.modified
          ? distribute(draft.payers, totalMinor)
          : distribute(this.defaultPayers(draft.payers), totalMinor),
        splits: distribute(draft.splits, totalMinor),
      };
    });
  }

  /** Commits an editor screen's result and marks that allocation as the user's. */
  commit(kind: AllocationKind, allocation: Allocation): void {
    this.state.update((draft) =>
      draft ? { ...draft, [kind]: { ...allocation, modified: true } } : draft,
    );
  }

  clear(): void {
    this.state.set(null);
  }

  /** Re-selects only the current user, undoing any uncommitted default drift. */
  private defaultPayers(payers: Allocation): Allocation {
    const currentUserId = this.currentUserId();

    return {
      ...payers,
      mode: 'equal',
      entries: payers.entries.map((entry) => ({
        ...entry,
        selected: currentUserId !== null && entry.userId === currentUserId,
      })),
    };
  }
}

/** Sum of the amounts that will actually be sent for this allocation. */
export function allocatedMinor(allocation: Allocation): number {
  return sumMinor(
    allocation.entries.filter((entry) => entry.selected).map((entry) => entry.amountMinor),
  );
}

/**
 * Spreads `totalMinor` across the selected entries of an equal allocation.
 * Custom allocations are returned untouched — redistributing them would throw
 * away amounts the user typed.
 */
export function distribute(allocation: Allocation, totalMinor: number): Allocation {
  const entries = allocation.entries.map((entry) => ({
    ...entry,
    amountMinor: entry.selected ? entry.amountMinor : 0,
  }));

  if (allocation.mode !== 'equal') return { ...allocation, entries };

  const selected = entries.filter((entry) => entry.selected);
  const shares = splitEquallyMinor(totalMinor, selected.length);
  selected.forEach((entry, i) => (entry.amountMinor = shares[i]));

  return { ...allocation, entries };
}

function toEntry(member: GroupMember): AllocationEntry {
  return {
    memberId: member.memberId,
    userId: member.userId,
    displayName: member.displayName,
    selected: false,
    amountMinor: 0,
  };
}

/**
 * Rebuilds an allocation from stored amounts. The mode is not persisted, so it
 * is inferred: amounts that match an equal division are shown as an equal split
 * rather than as a custom one.
 */
function fromPersisted(
  members: GroupMember[],
  stored: MemberAmountEntry[],
  totalMinor: number,
): Allocation {
  const entries = members.map((member) => {
    const match = stored.find((item) => item.memberId === member.memberId);

    return {
      ...toEntry(member),
      selected: !!match,
      amountMinor: toMinor(match?.amount ?? 0),
    };
  });

  const allocation: Allocation = { mode: 'custom', modified: true, entries };
  const equal = distribute({ ...allocation, mode: 'equal' }, totalMinor);
  const matchesEqualSplit = equal.entries.every(
    (entry, i) => entry.amountMinor === entries[i].amountMinor,
  );

  return matchesEqualSplit ? { ...equal, mode: 'equal', modified: true } : allocation;
}
