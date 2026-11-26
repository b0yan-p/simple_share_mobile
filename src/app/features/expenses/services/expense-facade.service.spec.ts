import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, throwError } from 'rxjs';
import { NetworkService } from 'src/app/core/services/network.service';
import { ToastService } from 'src/app/core/services/toast.service';
import { ExpenseApiService } from './expense-api.service';
import { ExpenseFacade } from './expense-facade.service';
import { ExpenseIdbService } from './expense-idb.service';

describe('ExpenseFacade mutations', () => {
  let facade: ExpenseFacade;
  let api: jasmine.SpyObj<ExpenseApiService>;

  beforeEach(() => {
    api = jasmine.createSpyObj<ExpenseApiService>('ExpenseApiService', [
      'updateExpense',
      'deleteExpense',
    ]);
    TestBed.configureTestingModule({
      providers: [
        ExpenseFacade,
        { provide: ExpenseApiService, useValue: api },
        { provide: ExpenseIdbService, useValue: {} },
        { provide: NetworkService, useValue: {} },
        { provide: ToastService, useValue: {} },
      ],
    });
    facade = TestBed.inject(ExpenseFacade);
  });

  it('keeps an accepted delete successful when refreshing fails', async () => {
    api.deleteExpense.and.returnValue(of(void 0));
    spyOn(facade, 'refreshExpenses').and.returnValue(throwError(() => new Error('IDB failed')));

    expect(await firstValueFrom(facade.deleteExpense('group', 'expense'))).toBeFalse();
    expect(api.deleteExpense).toHaveBeenCalledOnceWith('group', 'expense');
  });

  it('reports a rejected update as an error and does not refresh', async () => {
    api.updateExpense.and.returnValue(throwError(() => new Error('Server rejected update')));
    const refresh = spyOn(facade, 'refreshExpenses');

    await expectAsync(
      firstValueFrom(facade.updateExpense('group', { id: 'expense' })),
    ).toBeRejectedWithError('Server rejected update');
    expect(refresh).not.toHaveBeenCalled();
  });
});
